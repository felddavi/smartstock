package com.smartstock.backend.service;

import com.smartstock.backend.dto.ItemVendaDTO;
import com.smartstock.backend.dto.VendaRequestDTO;
import com.smartstock.backend.dto.VendaResponseDTO;
import com.smartstock.backend.model.ItemVenda;
import com.smartstock.backend.model.Movimentacao;
import com.smartstock.backend.model.Produto;
import com.smartstock.backend.model.Venda;
import com.smartstock.backend.model.enums.TipoMovimentacao;
import com.smartstock.backend.repository.ItemVendaRepository;
import com.smartstock.backend.repository.MovimentacaoRepository;
import com.smartstock.backend.repository.ProdutoRepository;
import com.smartstock.backend.repository.VendaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class VendaIntegrationTest {

    @Autowired
    private VendaService vendaService;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private VendaRepository vendaRepository;

    @Autowired
    private ItemVendaRepository itemVendaRepository;

    @Autowired
    private MovimentacaoRepository movimentacaoRepository;

    @BeforeEach
    void setUp() {
        // Limpa na ordem reversa das foreign keys para isolamento entre testes
        movimentacaoRepository.deleteAll();
        itemVendaRepository.deleteAll();
        vendaRepository.deleteAll();
        produtoRepository.deleteAll();
    }

    @Test
    @DisplayName("Integração: Deve persistir venda física no banco H2, atualizar saldo e registrar movimentação em cascata")
    void deveRealizarVendaPersistindoDadosNoBancoEmMemoria() {
        // Arrange: insere 2 produtos reais no banco H2
        Produto teclado = produtoRepository.save(new Produto(
                null, "Teclado Mecânico RGB", "Periféricos", new BigDecimal("200.00"), 10, 2
        ));
        Produto mouse = produtoRepository.save(new Produto(
                null, "Mouse Gamer 16000DPI", "Periféricos", new BigDecimal("100.00"), 8, 2
        ));

        VendaRequestDTO request = new VendaRequestDTO(List.of(
                new ItemVendaDTO(teclado.getId(), 2), // 2 * 200 = 400.00
                new ItemVendaDTO(mouse.getId(), 1)    // 1 * 100 = 100.00
        ));

        // Act
        VendaResponseDTO response = vendaService.realizarVenda(request);

        // Assert - Resposta
        assertNotNull(response);
        assertNotNull(response.id());
        assertEquals(new BigDecimal("500.00"), response.valorTotal());
        assertEquals(2, response.itens().size());

        // Assert - Persistência física da Venda
        Venda vendaSalva = vendaRepository.findById(response.id()).orElseThrow();
        assertEquals(new BigDecimal("500.00"), vendaSalva.getValorTotal());
        assertNotNull(vendaSalva.getDataHora());

        // Assert - Persistência dos Itens de Venda
        List<ItemVenda> itens = itemVendaRepository.findAll();
        assertEquals(2, itens.size());

        // Assert - Atualização física do saldo dos produtos no banco
        Produto tecladoAtualizado = produtoRepository.findById(teclado.getId()).orElseThrow();
        assertEquals(8, tecladoAtualizado.getQuantidade()); // 10 - 2

        Produto mouseAtualizado = produtoRepository.findById(mouse.getId()).orElseThrow();
        assertEquals(7, mouseAtualizado.getQuantidade()); // 8 - 1

        // Assert - Auditoria física das movimentações de SAIDA_VENDA
        List<Movimentacao> movimentacoes = movimentacaoRepository.findAll();
        assertEquals(2, movimentacoes.size());
        assertTrue(movimentacoes.stream().allMatch(m -> m.getTipoMovimentacao() == TipoMovimentacao.SAIDA_VENDA));
    }

    @Test
    @DisplayName("Integração: Deve garantir rollback total no banco quando qualquer item falhar por saldo insuficiente")
    void deveGarantirRollbackIntegralNoBancoQuandoFalhar() {
        // Arrange: Produto 1 com saldo suficiente, Produto 2 com saldo insuficiente
        Produto p1 = produtoRepository.save(new Produto(
                null, "Monitor 144Hz", "Monitores", new BigDecimal("1000.00"), 5, 1
        ));
        Produto p2 = produtoRepository.save(new Produto(
                null, "Placa de Vídeo RTX", "Hardware", new BigDecimal("3000.00"), 1, 1
        ));

        VendaRequestDTO requestInvalido = new VendaRequestDTO(List.of(
                new ItemVendaDTO(p1.getId(), 2), // saldo OK (5 >= 2)
                new ItemVendaDTO(p2.getId(), 3)  // saldo INSUFICIENTE (1 < 3)
        ));

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vendaService.realizarVenda(requestInvalido)
        );
        assertTrue(ex.getMessage().contains("Estoque insuficiente para o produto 'Placa de Vídeo RTX'"));

        // Assert - Nenhuma venda ou item gravado
        assertEquals(0, vendaRepository.count());
        assertEquals(0, itemVendaRepository.count());
        assertEquals(0, movimentacaoRepository.count());

        // Assert - Saldos originais preservados intactos no banco
        Produto p1Recarregado = produtoRepository.findById(p1.getId()).orElseThrow();
        assertEquals(5, p1Recarregado.getQuantidade());

        Produto p2Recarregado = produtoRepository.findById(p2.getId()).orElseThrow();
        assertEquals(1, p2Recarregado.getQuantidade());
    }
}
