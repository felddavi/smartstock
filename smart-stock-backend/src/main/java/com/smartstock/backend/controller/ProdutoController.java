package com.smartstock.backend.controller;

import com.smartstock.backend.dto.ProdutoRequestDTO;
import com.smartstock.backend.model.Produto;
import com.smartstock.backend.service.ProdutoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produtos")
@CrossOrigin(origins = "*") // Permite que o React (em outra porta) acesse a API sem problemas de CORS
public class ProdutoController {

    private final ProdutoService produtoService;

    @Autowired
    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    // 1. Listar todos ou buscar por nome (?nome=...)
    @GetMapping
    public List<Produto> listar(@RequestParam(required = false) String nome) {
        return produtoService.listarOuBuscar(nome);
    }

    // 2. Buscar produto por ID específico
    @GetMapping("/{id}")
    public ResponseEntity<Produto> buscarPorId(@PathVariable Long id) {
        return produtoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Cadastrar novo produto
    @PostMapping
    public ResponseEntity<Produto> salvar(@Valid @RequestBody ProdutoRequestDTO dto) {
        Produto novoProduto = produtoService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoProduto);
    }

    // 4. Atualizar produto existente
    @PutMapping("/{id}")
    public ResponseEntity<Produto> atualizar(@PathVariable Long id, @Valid @RequestBody ProdutoRequestDTO dto) {
        return produtoService.atualizar(id, dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 5. Atualizar rápido o estoque (Entrada ou Saída: /api/produtos/1/estoque?quantidade=5)
    @PatchMapping("/{id}/estoque")
    public ResponseEntity<Produto> atualizarEstoque(@PathVariable Long id, @RequestParam int quantidade) {
        try {
            Produto produtoAtualizado = produtoService.atualizarEstoque(id, quantidade);
            return ResponseEntity.ok(produtoAtualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // 6. Deletar produto
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (produtoService.buscarPorId(id).isPresent()) {
            produtoService.deletar(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}