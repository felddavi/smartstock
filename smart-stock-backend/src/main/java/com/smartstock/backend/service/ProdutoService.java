package com.smartstock.backend.service;

import com.smartstock.backend.dto.ProdutoRequestDTO;
import com.smartstock.backend.model.Produto;
import com.smartstock.backend.repository.ProdutoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;

    public ProdutoService(ProdutoRepository produtoRepository) {
        this.produtoRepository = produtoRepository;
    }

    // Listar todos os produtos ou buscar por nome se houver filtro
    public List<Produto> listarOuBuscar(String nome) {
        if (nome != null && !nome.isBlank()) {
            return produtoRepository.findByNomeContainingIgnoreCase(nome);
        }
        return produtoRepository.findAll();
    }

    // Buscar produto por ID
    public Optional<Produto> buscarPorId(Long id) {
        return produtoRepository.findById(id);
    }

    // Cadastrar novo produto a partir do DTO
    public Produto salvar(ProdutoRequestDTO dto) {
        Produto produto = new Produto();
        produto.setNome(dto.nome());
        produto.setCategoria(dto.categoria());
        produto.setPreco(dto.preco());
        produto.setQuantidade(dto.quantidade());
        produto.setEstoqueMinimo(dto.estoqueMinimo());
        return produtoRepository.save(produto);
    }

    // Atualizar produto existente a partir do DTO
    public Optional<Produto> atualizar(Long id, ProdutoRequestDTO dto) {
        return produtoRepository.findById(id).map(produtoExistente -> {
            produtoExistente.setNome(dto.nome());
            produtoExistente.setCategoria(dto.categoria());
            produtoExistente.setPreco(dto.preco());
            produtoExistente.setQuantidade(dto.quantidade());
            produtoExistente.setEstoqueMinimo(dto.estoqueMinimo());
            return produtoRepository.save(produtoExistente);
        });
    }

    // Sobrecarga para salvar entidade diretamente (se necessário)
    public Produto salvar(Produto produto) {
        return produtoRepository.save(produto);
    }

    // Deletar um produto
    public void deletar(Long id) {
        produtoRepository.deleteById(id);
    }

    // Regra de negócio para atualizar o estoque rapidamente (Entrada ou Saída)
    public Produto atualizarEstoque(Long id, int quantidadeMudanca) {
        Produto produto = produtoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado com o ID: " + id));

        int novaQuantidade = produto.getQuantidade() + quantidadeMudanca;

        if (novaQuantidade < 0) {
            throw new RuntimeException("Estoque insuficiente! A quantidade não pode ficar abaixo de zero.");
        }

        produto.setQuantidade(novaQuantidade);
        return produtoRepository.save(produto);
    }
}