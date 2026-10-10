package com.smartstock.backend.service;

import com.smartstock.backend.model.Movimentacao;
import com.smartstock.backend.model.Produto;
import com.smartstock.backend.model.enums.TipoMovimentacao;
import com.smartstock.backend.repository.MovimentacaoRepository;
import com.smartstock.backend.repository.ProdutoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MovimentacaoService {

    private final MovimentacaoRepository movimentacaoRepository;
    private final ProdutoRepository produtoRepository;

    public MovimentacaoService(MovimentacaoRepository movimentacaoRepository,
            ProdutoRepository produtoRepository) {
        this.movimentacaoRepository = movimentacaoRepository;
        this.produtoRepository = produtoRepository;
    }

    @Transactional
    public Movimentacao registrarMovimentacao(Long produtoId, TipoMovimentacao tipo, Integer quantidade,
            String motivo) {

        // 1. Busca o produto ou lança erro se não existir
        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado com o ID: " + produtoId));

        // 2. Valida se a quantidade é válida
        if (quantidade <= 0) {
            throw new RuntimeException("A quantidade da movimentação deve ser maior que zero.");
        }

        // 3. Atualiza o estoque usando os métodos do enum (isEntrada / isSaida)
        if (tipo.isEntrada()) {
            produto.setQuantidade(produto.getQuantidade() + quantidade);
        } else if (tipo.isSaida()) {
            if (produto.getQuantidade() < quantidade) {
                throw new RuntimeException(
                        "Estoque insuficiente! Quantidade atual: " + produto.getQuantidade() +
                                ". Quantidade solicitada: " + quantidade + ".");
            }
            produto.setQuantidade(produto.getQuantidade() - quantidade);
        }

        // 4. Persiste a atualização do estoque do produto
        produtoRepository.save(produto);

        // 5. Cria e salva o registro histórico da movimentação
        // dataHora não precisa ser setada manualmente: o @PrePersist da entidade já
        // cuida disso
        Movimentacao movimentacao = new Movimentacao();
        movimentacao.setProduto(produto);
        movimentacao.setTipoMovimentacao(tipo);
        movimentacao.setQuantidade(quantidade);
        movimentacao.setMotivo(motivo);

        return movimentacaoRepository.save(movimentacao);
    }

    // Listar todo o histórico do mais recente para o mais antigo
    public List<Movimentacao> listarHistorico() {
        return movimentacaoRepository.findAllByOrderByDataHoraDesc();
    }

    // Listar histórico de um produto específico
    public List<Movimentacao> listarHistoricoPorProduto(Long produtoId) {
        return movimentacaoRepository.findByProdutoId(produtoId);
    }
}
