package com.smartstock.backend.service;

import com.smartstock.backend.dto.ProdutoRequestDTO;
import com.smartstock.backend.model.Produto;
import com.smartstock.backend.repository.ProdutoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProdutoServiceTest {

    @Mock
    private ProdutoRepository produtoRepository;

    @InjectMocks
    private ProdutoService produtoService;

    @Test
    @DisplayName("Deve listar todos os produtos quando nome for nulo ou vazio")
    void deveListarTodosProdutosQuandoSemFiltro() {
        Produto p1 = new Produto(1L, "Mouse", "Periféricos", new BigDecimal("50.00"), 10, 2);
        Produto p2 = new Produto(2L, "Teclado", "Periféricos", new BigDecimal("120.00"), 5, 1);
        when(produtoRepository.findAll()).thenReturn(List.of(p1, p2));

        List<Produto> resultadoNulo = produtoService.listarOuBuscar(null);
        List<Produto> resultadoVazio = produtoService.listarOuBuscar("   ");

        assertEquals(2, resultadoNulo.size());
        assertEquals(2, resultadoVazio.size());
        verify(produtoRepository, times(2)).findAll();
        verify(produtoRepository, never()).findByNomeContainingIgnoreCase(any());
    }

    @Test
    @DisplayName("Deve buscar produtos por nome com filtro ignorando maiúsculas e minúsculas")
    void deveBuscarProdutosPorNome() {
        Produto p = new Produto(1L, "Teclado Mecânico", "Periféricos", new BigDecimal("150.00"), 8, 2);
        when(produtoRepository.findByNomeContainingIgnoreCase("teclado")).thenReturn(List.of(p));

        List<Produto> resultado = produtoService.listarOuBuscar("teclado");

        assertEquals(1, resultado.size());
        assertEquals("Teclado Mecânico", resultado.get(0).getNome());
        verify(produtoRepository).findByNomeContainingIgnoreCase("teclado");
        verify(produtoRepository, never()).findAll();
    }

    @Test
    @DisplayName("Deve buscar produto por ID com sucesso")
    void deveBuscarProdutoPorIdExistente() {
        Produto p = new Produto(1L, "Monitor", "Monitores", new BigDecimal("900.00"), 4, 1);
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(p));

        Optional<Produto> resultado = produtoService.buscarPorId(1L);

        assertTrue(resultado.isPresent());
        assertEquals("Monitor", resultado.get().getNome());
        verify(produtoRepository).findById(1L);
    }

    @Test
    @DisplayName("Deve retornar Optional vazio ao buscar produto por ID inexistente")
    void deveRetornarVazioAoBuscarPorIdInexistente() {
        when(produtoRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Produto> resultado = produtoService.buscarPorId(99L);

        assertTrue(resultado.isEmpty());
        verify(produtoRepository).findById(99L);
    }

    @Test
    @DisplayName("Deve cadastrar novo produto a partir do DTO")
    void deveSalvarNovoProdutoComDTO() {
        ProdutoRequestDTO dto = new ProdutoRequestDTO(
                "Headset Gamer", "Áudio", new BigDecimal("250.00"), 15, 3
        );

        when(produtoRepository.save(any(Produto.class))).thenAnswer(invocation -> {
            Produto p = invocation.getArgument(0);
            p.setId(10L);
            return p;
        });

        Produto salvo = produtoService.salvar(dto);

        assertNotNull(salvo);
        assertEquals(10L, salvo.getId());
        assertEquals("Headset Gamer", salvo.getNome());
        assertEquals("Áudio", salvo.getCategoria());
        assertEquals(new BigDecimal("250.00"), salvo.getPreco());
        assertEquals(15, salvo.getQuantidade());
        assertEquals(3, salvo.getEstoqueMinimo());

        ArgumentCaptor<Produto> captor = ArgumentCaptor.forClass(Produto.class);
        verify(produtoRepository).save(captor.capture());
        Produto capturado = captor.getValue();
        assertEquals("Headset Gamer", capturado.getNome());
    }

    @Test
    @DisplayName("Deve atualizar produto existente com sucesso")
    void deveAtualizarProdutoExistente() {
        Produto existente = new Produto(1L, "Mouse Antigo", "Periféricos", new BigDecimal("40.00"), 10, 2);
        ProdutoRequestDTO dto = new ProdutoRequestDTO(
                "Mouse Novo", "Periféricos", new BigDecimal("60.00"), 12, 4
        );

        when(produtoRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(produtoRepository.save(any(Produto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Optional<Produto> atualizado = produtoService.atualizar(1L, dto);

        assertTrue(atualizado.isPresent());
        assertEquals("Mouse Novo", atualizado.get().getNome());
        assertEquals(new BigDecimal("60.00"), atualizado.get().getPreco());
        assertEquals(12, atualizado.get().getQuantidade());
        assertEquals(4, atualizado.get().getEstoqueMinimo());
        verify(produtoRepository).save(existente);
    }

    @Test
    @DisplayName("Deve retornar Optional vazio ao tentar atualizar produto inexistente")
    void deveRetornarVazioAoAtualizarInexistente() {
        ProdutoRequestDTO dto = new ProdutoRequestDTO(
                "Inexistente", "Geral", new BigDecimal("10.00"), 1, 1
        );
        when(produtoRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Produto> atualizado = produtoService.atualizar(99L, dto);

        assertTrue(atualizado.isEmpty());
        verify(produtoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve deletar produto por ID")
    void deveDeletarProdutoPorId() {
        produtoService.deletar(1L);
        verify(produtoRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Deve atualizar estoque com sucesso em entrada (quantidade positiva)")
    void deveAtualizarEstoqueEmEntrada() {
        Produto p = new Produto(1L, "Cadeira Gamer", "Móveis", new BigDecimal("1200.00"), 5, 2);
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(p));
        when(produtoRepository.save(any(Produto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Produto resultado = produtoService.atualizarEstoque(1L, 3);

        assertEquals(8, resultado.getQuantidade());
        verify(produtoRepository).save(p);
    }

    @Test
    @DisplayName("Deve atualizar estoque com sucesso em saída válida (quantidade negativa sem zerar além do limite)")
    void deveAtualizarEstoqueEmSaidaValida() {
        Produto p = new Produto(1L, "Cadeira Gamer", "Móveis", new BigDecimal("1200.00"), 5, 2);
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(p));
        when(produtoRepository.save(any(Produto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Produto resultado = produtoService.atualizarEstoque(1L, -5);

        assertEquals(0, resultado.getQuantidade());
        verify(produtoRepository).save(p);
    }

    @Test
    @DisplayName("Deve lançar exceção e não salvar quando saída exceder saldo em estoque")
    void deveLancarExcecaoQuandoSaldoInsuficiente() {
        Produto p = new Produto(1L, "Cadeira Gamer", "Móveis", new BigDecimal("1200.00"), 5, 2);
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(p));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> produtoService.atualizarEstoque(1L, -6));

        assertEquals("Estoque insuficiente! A quantidade não pode ficar abaixo de zero.", ex.getMessage());
        verify(produtoRepository, never()).save(any());
        assertEquals(5, p.getQuantidade());
    }

    @Test
    @DisplayName("Deve lançar exceção ao atualizar estoque de produto não encontrado")
    void deveLancarExcecaoAoAtualizarEstoqueDeProdutoInexistente() {
        when(produtoRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> produtoService.atualizarEstoque(99L, 2));

        assertEquals("Produto não encontrado com o ID: 99", ex.getMessage());
        verify(produtoRepository, never()).save(any());
    }
}
