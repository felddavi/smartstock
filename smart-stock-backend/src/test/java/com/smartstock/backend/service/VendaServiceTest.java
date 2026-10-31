package com.smartstock.backend.service;

import com.smartstock.backend.dto.ItemVendaDTO;
import com.smartstock.backend.dto.VendaRequestDTO;
import com.smartstock.backend.dto.VendaResponseDTO;
import com.smartstock.backend.model.Movimentacao;
import com.smartstock.backend.model.Produto;
import com.smartstock.backend.model.Venda;
import com.smartstock.backend.model.enums.TipoMovimentacao;
import com.smartstock.backend.repository.MovimentacaoRepository;
import com.smartstock.backend.repository.ProdutoRepository;
import com.smartstock.backend.repository.VendaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VendaServiceTest {

    @Mock
    private VendaRepository vendaRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private MovimentacaoRepository movimentacaoRepository;

    @InjectMocks
    private VendaService vendaService;

    @Test
    @DisplayName("Deve realizar venda válida com sucesso: atualiza estoque, salva venda e gera movimentações")
    void deveRealizarVendaComSucesso() {
        // Arrange
        Produto p1 = new Produto(1L, "Teclado Mecânico", "Periféricos", new BigDecimal("150.00"), 10, 2);
        Produto p2 = new Produto(2L, "Mouse Gamer", "Periféricos", new BigDecimal("80.00"), 5, 1);

        when(produtoRepository.findById(1L)).thenReturn(Optional.of(p1));
        when(produtoRepository.findById(2L)).thenReturn(Optional.of(p2));

        when(vendaRepository.save(any(Venda.class))).thenAnswer(invocation -> {
            Venda v = invocation.getArgument(0);
            v.setId(100L);
            v.setDataHora(LocalDateTime.now());
            return v;
        });

        VendaRequestDTO request = new VendaRequestDTO(List.of(
                new ItemVendaDTO(1L, 2), // 2 * 150 = 300.00
                new ItemVendaDTO(2L, 1)  // 1 * 80  = 80.00
        ));

        // Act
        VendaResponseDTO response = vendaService.realizarVenda(request);

        // Assert
        assertNotNull(response);
        assertEquals(100L, response.id());
        assertEquals(new BigDecimal("380.00"), response.valorTotal());
        assertEquals(2, response.itens().size());

        // 1. Verifica dedução do saldo de estoque dos produtos
        assertEquals(8, p1.getQuantidade()); // 10 - 2
        assertEquals(4, p2.getQuantidade()); // 5 - 1
        verify(produtoRepository).save(p1);
        verify(produtoRepository).save(p2);

        // 2. Verifica se a Venda foi salva
        verify(vendaRepository).save(any(Venda.class));

        // 3. Verifica se as movimentações de SAIDA_VENDA foram salvas para cada item
        ArgumentCaptor<Movimentacao> movCaptor = ArgumentCaptor.forClass(Movimentacao.class);
        verify(movimentacaoRepository, times(2)).save(movCaptor.capture());

        List<Movimentacao> movimentacoes = movCaptor.getAllValues();
        assertEquals(TipoMovimentacao.SAIDA_VENDA, movimentacoes.get(0).getTipoMovimentacao());
        assertEquals(2, movimentacoes.get(0).getQuantidade());
        assertEquals("Venda PDV #100", movimentacoes.get(0).getMotivo());

        assertEquals(TipoMovimentacao.SAIDA_VENDA, movimentacoes.get(1).getTipoMovimentacao());
        assertEquals(1, movimentacoes.get(1).getQuantidade());
        assertEquals("Venda PDV #100", movimentacoes.get(1).getMotivo());
    }

    @Test
    @DisplayName("Deve rejeitar venda quando o DTO for nulo ou itens vazios")
    void deveRejeitarVendaComCarrinhoVazio() {
        // DTO nulo
        RuntimeException exNull = assertThrows(RuntimeException.class,
                () -> vendaService.realizarVenda(null));
        assertEquals("A venda deve conter pelo menos um item.", exNull.getMessage());

        // DTO com lista nula
        VendaRequestDTO requestItensNulo = new VendaRequestDTO(null);
        RuntimeException exItensNulo = assertThrows(RuntimeException.class,
                () -> vendaService.realizarVenda(requestItensNulo));
        assertEquals("A venda deve conter pelo menos um item.", exItensNulo.getMessage());

        // DTO com lista vazia
        VendaRequestDTO requestVazio = new VendaRequestDTO(Collections.emptyList());
        RuntimeException exVazio = assertThrows(RuntimeException.class,
                () -> vendaService.realizarVenda(requestVazio));
        assertEquals("A venda deve conter pelo menos um item.", exVazio.getMessage());

        verifyNoInteractions(vendaRepository, produtoRepository, movimentacaoRepository);
    }

    @Test
    @DisplayName("Deve rejeitar venda quando algum item tiver quantidade menor ou igual a zero")
    void deveRejeitarItemComQuantidadeInvalida() {
        VendaRequestDTO requestQtdZero = new VendaRequestDTO(List.of(
                new ItemVendaDTO(1L, 0)
        ));
        RuntimeException exZero = assertThrows(RuntimeException.class,
                () -> vendaService.realizarVenda(requestQtdZero));
        assertEquals("A quantidade do item deve ser maior que zero.", exZero.getMessage());

        VendaRequestDTO requestQtdNegativa = new VendaRequestDTO(List.of(
                new ItemVendaDTO(1L, -5)
        ));
        RuntimeException exNegativa = assertThrows(RuntimeException.class,
                () -> vendaService.realizarVenda(requestQtdNegativa));
        assertEquals("A quantidade do item deve ser maior que zero.", exNegativa.getMessage());

        VendaRequestDTO requestQtdNula = new VendaRequestDTO(List.of(
                new ItemVendaDTO(1L, null)
        ));
        RuntimeException exNula = assertThrows(RuntimeException.class,
                () -> vendaService.realizarVenda(requestQtdNula));
        assertEquals("A quantidade do item deve ser maior que zero.", exNula.getMessage());

        verifyNoInteractions(vendaRepository, produtoRepository, movimentacaoRepository);
    }

    @Test
    @DisplayName("Deve rejeitar venda quando o ID do produto for nulo")
    void deveRejeitarItemComProdutoIdNulo() {
        VendaRequestDTO request = new VendaRequestDTO(List.of(
                new ItemVendaDTO(null, 2)
        ));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> vendaService.realizarVenda(request));
        assertEquals("ID do produto é obrigatório.", ex.getMessage());

        verifyNoInteractions(vendaRepository, produtoRepository, movimentacaoRepository);
    }

    @Test
    @DisplayName("Deve rejeitar venda se um item intermediário tiver saldo insuficiente, sem salvar nada nem baixar itens anteriores")
    void deveRejeitarQuandoItemIntermediarioTemSaldoInsuficiente() {
        // Arrange: Produto 1 tem saldo (10), Produto 2 NÃO tem saldo suficiente (saldo 1, solicitado 5)
        Produto p1 = new Produto(1L, "Teclado", "Periféricos", new BigDecimal("100.00"), 10, 2);
        Produto p2 = new Produto(2L, "Monitor", "Monitores", new BigDecimal("800.00"), 1, 1);

        when(produtoRepository.findById(1L)).thenReturn(Optional.of(p1));
        when(produtoRepository.findById(2L)).thenReturn(Optional.of(p2));

        VendaRequestDTO request = new VendaRequestDTO(List.of(
                new ItemVendaDTO(1L, 2), // p1 tem 10, quer 2 (OK)
                new ItemVendaDTO(2L, 5)  // p2 tem 1, quer 5 (FALHA)
        ));

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> vendaService.realizarVenda(request));

        assertTrue(ex.getMessage().contains("Estoque insuficiente para o produto 'Monitor'"));
        assertTrue(ex.getMessage().contains("Saldo disponível: 1"));
        assertTrue(ex.getMessage().contains("solicitado: 5"));

        // Garantia de atomicidade: NENHUM save pode ter ocorrido
        verify(vendaRepository, never()).save(any());
        verify(movimentacaoRepository, never()).save(any());
        verify(produtoRepository, never()).save(any());

        // Saldo do produto 1 deve permanecer 10 intacto (não foi debitado)
        assertEquals(10, p1.getQuantidade());
        assertEquals(1, p2.getQuantidade());
    }

    @Test
    @DisplayName("Deve rejeitar venda quando produto não for encontrado")
    void deveRejeitarQuandoProdutoNaoExiste() {
        when(produtoRepository.findById(99L)).thenReturn(Optional.empty());

        VendaRequestDTO request = new VendaRequestDTO(List.of(
                new ItemVendaDTO(99L, 1)
        ));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> vendaService.realizarVenda(request));

        assertEquals("Produto não encontrado com o ID: 99", ex.getMessage());

        verify(vendaRepository, never()).save(any());
        verify(movimentacaoRepository, never()).save(any());
        verify(produtoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve listar todas as vendas com sucesso")
    void deveListarTodasAsVendas() {
        Venda v = new Venda(1L, LocalDateTime.now(), new BigDecimal("100.00"), Collections.emptyList());
        when(vendaRepository.findAll()).thenReturn(List.of(v));

        List<VendaResponseDTO> lista = vendaService.listarTodas();

        assertEquals(1, lista.size());
        assertEquals(1L, lista.get(0).id());
        verify(vendaRepository).findAll();
    }

    @Test
    @DisplayName("Deve buscar venda por ID com sucesso")
    void deveBuscarVendaPorId() {
        Venda v = new Venda(1L, LocalDateTime.now(), new BigDecimal("100.00"), Collections.emptyList());
        when(vendaRepository.findById(1L)).thenReturn(Optional.of(v));

        Optional<VendaResponseDTO> opt = vendaService.buscarPorId(1L);

        assertTrue(opt.isPresent());
        assertEquals(1L, opt.get().id());
        verify(vendaRepository).findById(1L);
    }
}
