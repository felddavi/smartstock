package com.smartstock.backend.controller;

import com.smartstock.backend.dto.ProdutoRequestDTO;
import com.smartstock.backend.model.Produto;
import com.smartstock.backend.service.ProdutoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProdutoController.class)
class ProdutoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProdutoService produtoService;

    @Test
    @DisplayName("GET /api/produtos - Deve retornar 200 OK com lista de produtos")
    void deveRetornar200AoListarProdutos() throws Exception {
        Produto p1 = new Produto(1L, "Mouse", "Periféricos", new BigDecimal("50.00"), 10, 2);
        when(produtoService.listarOuBuscar(null)).thenReturn(List.of(p1));

        mockMvc.perform(get("/api/produtos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].nome").value("Mouse"))
                .andExpect(jsonPath("$[0].quantidade").value(10));
    }

    @Test
    @DisplayName("GET /api/produtos?nome=teclado - Deve retornar 200 OK com produtos filtrados")
    void deveRetornar200AoBuscarPorNome() throws Exception {
        Produto p = new Produto(2L, "Teclado", "Periféricos", new BigDecimal("120.00"), 5, 1);
        when(produtoService.listarOuBuscar("teclado")).thenReturn(List.of(p));

        mockMvc.perform(get("/api/produtos").param("nome", "teclado"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].nome").value("Teclado"));
    }

    @Test
    @DisplayName("GET /api/produtos/{id} - Deve retornar 200 OK quando o produto existir")
    void deveRetornar200AoBuscarProdutoPorIdExistente() throws Exception {
        Produto p = new Produto(1L, "Monitor", "Monitores", new BigDecimal("850.00"), 4, 1);
        when(produtoService.buscarPorId(1L)).thenReturn(Optional.of(p));

        mockMvc.perform(get("/api/produtos/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Monitor"));
    }

    @Test
    @DisplayName("GET /api/produtos/{id} - Deve retornar 404 Not Found quando produto não existir")
    void deveRetornar404AoBuscarProdutoPorIdInexistente() throws Exception {
        when(produtoService.buscarPorId(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/produtos/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/produtos - Deve retornar 201 Created quando o DTO for válido")
    void deveRetornar201AoCadastrarProdutoValido() throws Exception {
        Produto salvo = new Produto(1L, "Webcam HD", "Vídeo", new BigDecimal("199.90"), 8, 2);
        when(produtoService.salvar(any(ProdutoRequestDTO.class))).thenReturn(salvo);

        String jsonRequest = """
                {
                    "nome": "Webcam HD",
                    "categoria": "Vídeo",
                    "preco": 199.90,
                    "quantidade": 8,
                    "estoqueMinimo": 2
                }
                """;

        mockMvc.perform(post("/api/produtos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Webcam HD"))
                .andExpect(jsonPath("$.preco").value(199.90));
    }

    @Test
    @DisplayName("POST /api/produtos - Deve retornar 400 Bad Request quando validação falhar")
    void deveRetornar400AoCadastrarProdutoInvalido() throws Exception {
        String jsonInvalido = """
                {
                    "nome": "",
                    "categoria": "",
                    "preco": -10.0,
                    "quantidade": -1,
                    "estoqueMinimo": -2
                }
                """;

        mockMvc.perform(post("/api/produtos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonInvalido))
                .andExpect(status().isBadRequest());

        verify(produtoService, never()).salvar(any(ProdutoRequestDTO.class));
    }

    @Test
    @DisplayName("PUT /api/produtos/{id} - Deve retornar 200 OK quando atualizar produto existente")
    void deveRetornar200AoAtualizarProdutoExistente() throws Exception {
        Produto atualizado = new Produto(1L, "Mouse RGB", "Periféricos", new BigDecimal("79.90"), 12, 3);
        when(produtoService.atualizar(eq(1L), any(ProdutoRequestDTO.class))).thenReturn(Optional.of(atualizado));

        String jsonRequest = """
                {
                    "nome": "Mouse RGB",
                    "categoria": "Periféricos",
                    "preco": 79.90,
                    "quantidade": 12,
                    "estoqueMinimo": 3
                }
                """;

        mockMvc.perform(put("/api/produtos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Mouse RGB"));
    }

    @Test
    @DisplayName("PUT /api/produtos/{id} - Deve retornar 404 Not Found quando produto a atualizar não existir")
    void deveRetornar404AoAtualizarProdutoInexistente() throws Exception {
        when(produtoService.atualizar(eq(99L), any(ProdutoRequestDTO.class))).thenReturn(Optional.empty());

        String jsonRequest = """
                {
                    "nome": "Inexistente",
                    "categoria": "Geral",
                    "preco": 10.00,
                    "quantidade": 1,
                    "estoqueMinimo": 1
                }
                """;

        mockMvc.perform(put("/api/produtos/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PATCH /api/produtos/{id}/estoque - Deve retornar 200 OK ao atualizar estoque com sucesso")
    void deveRetornar200AoAtualizarEstoque() throws Exception {
        Produto p = new Produto(1L, "Fone", "Áudio", new BigDecimal("100.00"), 15, 2);
        when(produtoService.atualizarEstoque(1L, 5)).thenReturn(p);

        mockMvc.perform(patch("/api/produtos/1/estoque").param("quantidade", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.quantidade").value(15));
    }

    @Test
    @DisplayName("PATCH /api/produtos/{id}/estoque - Deve retornar 400 Bad Request quando service lançar erro de estoque insuficiente")
    void deveRetornar400AoAtualizarEstoqueComErro() throws Exception {
        when(produtoService.atualizarEstoque(1L, -50))
                .thenThrow(new RuntimeException("Estoque insuficiente!"));

        mockMvc.perform(patch("/api/produtos/1/estoque").param("quantidade", "-50"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/produtos/{id} - Deve retornar 204 No Content quando produto existir")
    void deveRetornar204AoDeletarProdutoExistente() throws Exception {
        Produto p = new Produto(1L, "Cabo USB", "Cabos", new BigDecimal("15.00"), 30, 5);
        when(produtoService.buscarPorId(1L)).thenReturn(Optional.of(p));
        doNothing().when(produtoService).deletar(1L);

        mockMvc.perform(delete("/api/produtos/1"))
                .andExpect(status().isNoContent());

        verify(produtoService).deletar(1L);
    }

    @Test
    @DisplayName("DELETE /api/produtos/{id} - Deve retornar 404 Not Found quando produto a deletar não existir")
    void deveRetornar404AoDeletarProdutoInexistente() throws Exception {
        when(produtoService.buscarPorId(99L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/produtos/99"))
                .andExpect(status().isNotFound());

        verify(produtoService, never()).deletar(any());
    }
}
