package com.smartstock.backend.controller;

import com.smartstock.backend.dto.MovimentacaoRequestDTO;
import com.smartstock.backend.model.Movimentacao;
import com.smartstock.backend.service.MovimentacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movimentacoes")
@CrossOrigin(origins = "*") // Permite que o front-end (React) acesse esta API
public class MovimentacaoController {

    private final MovimentacaoService movimentacaoService;

    @Autowired
    public MovimentacaoController(MovimentacaoService movimentacaoService) {
        this.movimentacaoService = movimentacaoService;
    }

    // ROTA 1: Registrar Movimentação
    // Endpoint: POST /api/movimentacoes
    // Body: { "produtoId": 1, "tipo": "ENTRADA_REPOSICAO", "quantidade": 10,
    // "motivo": "Chegou mais estoque" }
    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody MovimentacaoRequestDTO dto) {
        try {
            Movimentacao novaMovimentacao = movimentacaoService.registrarMovimentacao(
                    dto.produtoId(),
                    dto.tipo(),
                    dto.quantidade(),
                    dto.motivo());
            // Retorna o objeto criado com status 201 Created
            return ResponseEntity.status(HttpStatus.CREATED).body(novaMovimentacao);
        } catch (RuntimeException e) {
            // Retorna erro 400 se o estoque for insuficiente ou produto não existir
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ROTA 2: Listar Todo o Histórico
    // Endpoint: GET /api/movimentacoes
    // Retorna todas as movimentações ordenadas por data (mais recente primeiro)
    @GetMapping
    public ResponseEntity<List<Movimentacao>> listarTodos() {
        List<Movimentacao> historico = movimentacaoService.listarHistorico();
        return ResponseEntity.ok(historico); // Retorna lista com status 200 OK
    }

    // ROTA 3: Listar Histórico por Produto
    // Endpoint: GET /api/movimentacoes/produto/{idDoProduto}
    // Ex: /api/movimentacoes/produto/1
    @GetMapping("/produto/{produtoId}")
    public ResponseEntity<List<Movimentacao>> listarPorProduto(@PathVariable Long produtoId) {
        List<Movimentacao> historicoDoProduto = movimentacaoService.listarHistoricoPorProduto(produtoId);
        return ResponseEntity.ok(historicoDoProduto); // Retorna lista filtrada com 200 OK
    }
}
