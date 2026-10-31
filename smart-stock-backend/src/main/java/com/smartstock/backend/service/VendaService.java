package com.smartstock.backend.service;

import com.smartstock.backend.dto.ItemVendaDTO;
import com.smartstock.backend.dto.ItemVendaResponseDTO;
import com.smartstock.backend.dto.VendaRequestDTO;
import com.smartstock.backend.dto.VendaResponseDTO;
import com.smartstock.backend.model.ItemVenda;
import com.smartstock.backend.model.Movimentacao;
import com.smartstock.backend.model.Produto;
import com.smartstock.backend.model.Venda;
import com.smartstock.backend.model.enums.TipoMovimentacao;
import com.smartstock.backend.repository.MovimentacaoRepository;
import com.smartstock.backend.repository.ProdutoRepository;
import com.smartstock.backend.repository.VendaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class VendaService {

    private final VendaRepository vendaRepository;
    private final ProdutoRepository produtoRepository;
    private final MovimentacaoRepository movimentacaoRepository;

    public VendaService(VendaRepository vendaRepository,
                        ProdutoRepository produtoRepository,
                        MovimentacaoRepository movimentacaoRepository) {
        this.vendaRepository = vendaRepository;
        this.produtoRepository = produtoRepository;
        this.movimentacaoRepository = movimentacaoRepository;
    }

    /**
     * Realiza uma venda atômica no PDV:
     * 1. Valida existência e saldo de estoque de TODOS os itens antes de alterar qualquer estado.
     * 2. Baixa o estoque de cada produto.
     * 3. Registra uma movimentação de SAIDA_VENDA para cada item baixado.
     * 4. Persiste a Venda com seus ItemVenda (preço unitário congelado).
     * 5. Em caso de qualquer inconsistência, o @Transactional garante rollback total.
     */
    @Transactional
    public VendaResponseDTO realizarVenda(VendaRequestDTO dto) {
        if (dto == null || dto.itens() == null || dto.itens().isEmpty()) {
            throw new RuntimeException("A venda deve conter pelo menos um item.");
        }

        // Validação inicial dos itens
        for (ItemVendaDTO itemDTO : dto.itens()) {
            if (itemDTO.produtoId() == null) {
                throw new RuntimeException("ID do produto é obrigatório.");
            }
            if (itemDTO.quantidade() == null || itemDTO.quantidade() <= 0) {
                throw new RuntimeException("A quantidade do item deve ser maior que zero.");
            }
        }

        // Agrupa as quantidades necessárias por produto caso haja repetição no carrinho
        Map<Long, Integer> quantidadesPorProduto = new LinkedHashMap<>();
        for (ItemVendaDTO itemDTO : dto.itens()) {
            quantidadesPorProduto.merge(itemDTO.produtoId(), itemDTO.quantidade(), Integer::sum);
        }

        // Pré-carrega e valida estoque de todos os produtos ANTES de alterar dados
        Map<Long, Produto> produtosCarregados = new HashMap<>();
        for (Map.Entry<Long, Integer> entry : quantidadesPorProduto.entrySet()) {
            Long produtoId = entry.getKey();
            Integer quantidadeNecessaria = entry.getValue();

            Produto produto = produtoRepository.findById(produtoId)
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado com o ID: " + produtoId));

            if (produto.getQuantidade() < quantidadeNecessaria) {
                throw new RuntimeException(
                        "Estoque insuficiente para o produto '" + produto.getNome() +
                        "'! Saldo disponível: " + produto.getQuantidade() +
                        ", solicitado: " + quantidadeNecessaria + "."
                );
            }

            produtosCarregados.put(produtoId, produto);
        }

        // Inicializa a Venda
        Venda venda = new Venda();
        BigDecimal valorTotalVenda = BigDecimal.ZERO;

        // Processa cada item do carrinho
        for (ItemVendaDTO itemDTO : dto.itens()) {
            Produto produto = produtosCarregados.get(itemDTO.produtoId());

            // 1. Deduz estoque do produto
            produto.setQuantidade(produto.getQuantidade() - itemDTO.quantidade());
            produtoRepository.save(produto);

            // 2. Calcula subtotal congelando o preço atual do produto
            BigDecimal precoUnitario = produto.getPreco();
            BigDecimal subtotal = precoUnitario.multiply(BigDecimal.valueOf(itemDTO.quantidade()));
            valorTotalVenda = valorTotalVenda.add(subtotal);

            // 3. Cria o ItemVenda vinculado à venda
            ItemVenda itemVenda = new ItemVenda();
            itemVenda.setProduto(produto);
            itemVenda.setQuantidade(itemDTO.quantidade());
            itemVenda.setPrecoUnitario(precoUnitario);
            itemVenda.setSubtotal(subtotal);
            venda.adicionarItem(itemVenda);
        }

        venda.setValorTotal(valorTotalVenda);

        // Salva a venda e os itens em cascata
        Venda vendaSalva = vendaRepository.save(venda);

        // 4. Registra as movimentações históricas de SAIDA_VENDA para auditoria
        for (ItemVenda itemVenda : vendaSalva.getItens()) {
            Movimentacao mov = new Movimentacao();
            mov.setProduto(itemVenda.getProduto());
            mov.setTipoMovimentacao(TipoMovimentacao.SAIDA_VENDA);
            mov.setQuantidade(itemVenda.getQuantidade());
            mov.setMotivo("Venda PDV #" + vendaSalva.getId());
            movimentacaoRepository.save(mov);
        }

        return toResponseDTO(vendaSalva);
    }

    public List<VendaResponseDTO> listarTodas() {
        return vendaRepository.findAll().stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public Optional<VendaResponseDTO> buscarPorId(Long id) {
        return vendaRepository.findById(id).map(this::toResponseDTO);
    }

    private VendaResponseDTO toResponseDTO(Venda venda) {
        List<ItemVendaResponseDTO> itensDTO = (venda.getItens() == null) ? List.of() :
                venda.getItens().stream()
                        .map(item -> new ItemVendaResponseDTO(
                                item.getId(),
                                item.getProduto().getId(),
                                item.getProduto().getNome(),
                                item.getQuantidade(),
                                item.getPrecoUnitario(),
                                item.getSubtotal()
                        ))
                        .toList();

        return new VendaResponseDTO(
                venda.getId(),
                venda.getDataHora(),
                venda.getValorTotal(),
                itensDTO
        );
    }
}
