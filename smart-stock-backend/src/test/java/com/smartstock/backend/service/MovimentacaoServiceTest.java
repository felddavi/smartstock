package com.smartstock.backend.service;

import com.smartstock.backend.model.Movimentacao;
import com.smartstock.backend.model.Produto;
import com.smartstock.backend.model.enums.TipoMovimentacao;
import com.smartstock.backend.repository.MovimentacaoRepository;
import com.smartstock.backend.repository.ProdutoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MovimentacaoServiceTest {

    @Mock
    private MovimentacaoRepository movimentacaoRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    @InjectMocks
    private MovimentacaoService movimentacaoService;

    @Test
    @DisplayName("Deve registrar entrada de reposição somando a quantidade ao saldo do produto")
    void deveRegistrarEntradaReposicaoComSucesso() {
        Produto produto = new Produto(1L, "Teclado", "Periféricos", new BigDecimal("100.00"), 10, 2);
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));
        when(movimentacaoRepository.save(any(Movimentacao.class))).thenAnswer(i -> {
            Movimentacao m = i.getArgument(0);
            m.setId(50L);
            m.setDataHora(LocalDateTime.now());
            return m;
        });

        Movimentacao mov = movimentacaoService.registrarMovimentacao(
                1L, TipoMovimentacao.ENTRADA_REPOSICAO, 5, "Chegada de lote fornecedor"
        );

        assertNotNull(mov);
        assertEquals(50L, mov.getId());
        assertEquals(TipoMovimentacao.ENTRADA_REPOSICAO, mov.getTipoMovimentacao());
        assertEquals(5, mov.getQuantidade());
        assertEquals("Chegada de lote fornecedor", mov.getMotivo());

        // Verifica atualização no saldo do produto: 10 + 5 = 15
        assertEquals(15, produto.getQuantidade());
        verify(produtoRepository).save(produto);
        verify(movimentacaoRepository).save(any(Movimentacao.class));
    }

    @Test
    @DisplayName("Deve registrar entrada por devolução somando a quantidade ao estoque")
    void deveRegistrarEntradaDevolucaoComSucesso() {
        Produto produto = new Produto(1L, "Mouse", "Periféricos", new BigDecimal("50.00"), 8, 2);
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));
        when(movimentacaoRepository.save(any(Movimentacao.class))).thenAnswer(i -> i.getArgument(0));

        Movimentacao mov = movimentacaoService.registrarMovimentacao(
                1L, TipoMovimentacao.ENTRADA_DEVOLUCAO, 2, "Devolução de cliente"
        );

        assertNotNull(mov);
        assertEquals(10, produto.getQuantidade()); // 8 + 2
        verify(produtoRepository).save(produto);
        verify(movimentacaoRepository).save(any(Movimentacao.class));
    }

    @Test
    @DisplayName("Deve registrar saída de venda debitando a quantidade do estoque")
    void deveRegistrarSaidaVendaComSucesso() {
        Produto produto = new Produto(1L, "Monitor", "Monitores", new BigDecimal("800.00"), 6, 1);
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));
        when(movimentacaoRepository.save(any(Movimentacao.class))).thenAnswer(i -> i.getArgument(0));

        Movimentacao mov = movimentacaoService.registrarMovimentacao(
                1L, TipoMovimentacao.SAIDA_VENDA, 2, "Venda balcão"
        );

        assertNotNull(mov);
        assertEquals(4, produto.getQuantidade()); // 6 - 2
        verify(produtoRepository).save(produto);
        verify(movimentacaoRepository).save(any(Movimentacao.class));
    }

    @Test
    @DisplayName("Deve registrar saída por avaria debitando a quantidade do estoque (ajuste de perda)")
    void deveRegistrarSaidaAvariaComSucesso() {
        Produto produto = new Produto(1L, "Cabo HDMI", "Cabos", new BigDecimal("30.00"), 20, 5);
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));
        when(movimentacaoRepository.save(any(Movimentacao.class))).thenAnswer(i -> i.getArgument(0));

        Movimentacao mov = movimentacaoService.registrarMovimentacao(
                1L, TipoMovimentacao.SAIDA_AVARIA, 3, "Item danificado na prateleira"
        );

        assertNotNull(mov);
        assertEquals(17, produto.getQuantidade()); // 20 - 3
        verify(produtoRepository).save(produto);
        verify(movimentacaoRepository).save(any(Movimentacao.class));
    }

    @Test
    @DisplayName("Deve permitir saída com quantidade exatamente igual ao saldo atual (zerando o estoque)")
    void devePermitirSaidaComQuantidadeExatamenteIgualAoSaldo() {
        Produto produto = new Produto(1L, "Produto Único", "Geral", new BigDecimal("10.00"), 5, 0);
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));
        when(movimentacaoRepository.save(any(Movimentacao.class))).thenAnswer(i -> i.getArgument(0));

        Movimentacao mov = movimentacaoService.registrarMovimentacao(
                1L, TipoMovimentacao.SAIDA_VENDA, 5, "Zerando estoque"
        );

        assertNotNull(mov);
        assertEquals(0, produto.getQuantidade()); // 5 - 5
        verify(produtoRepository).save(produto);
        verify(movimentacaoRepository).save(any(Movimentacao.class));
    }

    @Test
    @DisplayName("Deve rejeitar saída quando o saldo for insuficiente, sem alterar produto nem salvar movimentação")
    void deveRejeitarSaidaQuandoSaldoInsuficiente() {
        Produto produto = new Produto(1L, "Placa de Vídeo", "Hardware", new BigDecimal("3500.00"), 2, 1);
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                movimentacaoService.registrarMovimentacao(
                        1L, TipoMovimentacao.SAIDA_VENDA, 3, "Tentativa com saldo menor"
                )
        );

        assertTrue(ex.getMessage().contains("Estoque insuficiente!"));
        assertTrue(ex.getMessage().contains("Quantidade atual: 2"));
        assertTrue(ex.getMessage().contains("Quantidade solicitada: 3"));

        // Garante que o saldo permaneceu inalterado e nada foi salvo
        assertEquals(2, produto.getQuantidade());
        verify(produtoRepository, never()).save(any());
        verify(movimentacaoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve rejeitar movimentação com quantidade zero")
    void deveRejeitarQuantidadeZero() {
        Produto produto = new Produto(1L, "Webcam", "Vídeo", new BigDecimal("200.00"), 10, 2);
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                movimentacaoService.registrarMovimentacao(
                        1L, TipoMovimentacao.ENTRADA_REPOSICAO, 0, "Inválido"
                )
        );

        assertEquals("A quantidade da movimentação deve ser maior que zero.", ex.getMessage());
        verify(produtoRepository, never()).save(any());
        verify(movimentacaoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve rejeitar movimentação com quantidade negativa")
    void deveRejeitarQuantidadeNegativa() {
        Produto produto = new Produto(1L, "Webcam", "Vídeo", new BigDecimal("200.00"), 10, 2);
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                movimentacaoService.registrarMovimentacao(
                        1L, TipoMovimentacao.ENTRADA_REPOSICAO, -5, "Inválido negativo"
                )
        );

        assertEquals("A quantidade da movimentação deve ser maior que zero.", ex.getMessage());
        verify(produtoRepository, never()).save(any());
        verify(movimentacaoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve lançar exceção quando o produto não for encontrado")
    void deveLancarExcecaoQuandoProdutoNaoExiste() {
        when(produtoRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                movimentacaoService.registrarMovimentacao(
                        99L, TipoMovimentacao.ENTRADA_REPOSICAO, 10, "Produto fantasma"
                )
        );

        assertEquals("Produto não encontrado com o ID: 99", ex.getMessage());
        verify(produtoRepository, never()).save(any());
        verify(movimentacaoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve listar todo o histórico de movimentações ordenado por data descrescente")
    void deveListarHistoricoCompleto() {
        Movimentacao m1 = new Movimentacao();
        m1.setId(1L);
        Movimentacao m2 = new Movimentacao();
        m2.setId(2L);
        when(movimentacaoRepository.findAllByOrderByDataHoraDesc()).thenReturn(List.of(m1, m2));

        List<Movimentacao> historico = movimentacaoService.listarHistorico();

        assertEquals(2, historico.size());
        verify(movimentacaoRepository).findAllByOrderByDataHoraDesc();
    }

    @Test
    @DisplayName("Deve listar o histórico de movimentações filtrado por produto")
    void deveListarHistoricoPorProduto() {
        Movimentacao m = new Movimentacao();
        m.setId(10L);
        when(movimentacaoRepository.findByProdutoId(1L)).thenReturn(List.of(m));

        List<Movimentacao> resultado = movimentacaoService.listarHistoricoPorProduto(1L);

        assertEquals(1, resultado.size());
        assertEquals(10L, resultado.get(0).getId());
        verify(movimentacaoRepository).findByProdutoId(1L);
    }
}
