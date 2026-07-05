package com.sistema.tabacaria.controller;

import com.sistema.tabacaria.model.Pod;
import com.sistema.tabacaria.model.Venda;
import com.sistema.tabacaria.repository.PodRepository;
import com.sistema.tabacaria.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/pods")
@CrossOrigin(origins = "*")
public class PodController {

    @Autowired
    private PodRepository repository;

    @Autowired
    private VendaRepository vendaRepository;

    @GetMapping
    public List<Pod> listarTodos() {
        return repository.findAll();
    }

    @GetMapping("/vendas")
    public List<Venda> listarVendas() {
        return vendaRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Pod> cadastrarPod(@RequestBody Pod novoPod) {
        return ResponseEntity.ok(repository.save(novoPod));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirPod(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/vender")
    public ResponseEntity<Pod> venderPod(@PathVariable Long id) {
        return repository.findById(id).map(pod -> {
            if (pod.getEstoque() > 0) {
                pod.setEstoque(pod.getEstoque() - 1);
                pod.setVendidos(pod.getVendidos() + 1);

                Venda novaVenda = new Venda();
                novaVenda.setMarca(pod.getMarca());
                novaVenda.setSabor(pod.getSabor());
                novaVenda.setFaturamento(pod.getPrecoVarejo());
                novaVenda.setLucro(pod.getPrecoVarejo() - pod.getPrecoAtacado());
                novaVenda.setDataVenda(LocalDate.now());
                vendaRepository.save(novaVenda);

                return ResponseEntity.ok(repository.save(pod));
            }
            return ResponseEntity.badRequest().body(pod);
        }).orElse(ResponseEntity.notFound().build());
    }

    // <-- NOVO: Define o valor EXATO do estoque (para mais ou para menos, sem registrar venda) -->
    @PutMapping("/{id}/ajustar-estoque")
    public ResponseEntity<Pod> ajustarEstoque(@PathVariable Long id, @RequestParam Integer quantidade) {
        return repository.findById(id).map(pod -> {
            if (quantidade >= 0) {
                pod.setEstoque(quantidade);
                return ResponseEntity.ok(repository.save(pod));
            }
            return ResponseEntity.badRequest().body(pod);
        }).orElse(ResponseEntity.notFound().build());
    }

    // <-- NOVO: Desfaz a venda, devolve o estoque e APAGA o registro do lucro -->
    @PutMapping("/{id}/desfazer-venda")
    public ResponseEntity<Pod> desfazerVenda(@PathVariable Long id) {
        return repository.findById(id).map(pod -> {
            if (pod.getVendidos() > 0) {
                // 1. Devolve para o estoque físico e tira da contagem de vendidos
                pod.setEstoque(pod.getEstoque() + 1);
                pod.setVendidos(pod.getVendidos() - 1);

                // 2. Procura a última venda desse pod no financeiro e apaga
                List<Venda> vendas = vendaRepository.findAll();
                for (int i = vendas.size() - 1; i >= 0; i--) {
                    Venda v = vendas.get(i);
                    if (v.getMarca().equals(pod.getMarca()) && v.getSabor().equals(pod.getSabor())) {
                        vendaRepository.delete(v);
                        break; // Apaga apenas uma e para
                    }
                }
                return ResponseEntity.ok(repository.save(pod));
            }
            return ResponseEntity.badRequest().body(pod);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/precos")
    public ResponseEntity<Pod> atualizarPrecos(@PathVariable Long id, @RequestParam Double atacado, @RequestParam Double varejo) {
        return repository.findById(id).map(pod -> {
            pod.setPrecoAtacado(atacado);
            pod.setPrecoVarejo(varejo);
            return ResponseEntity.ok(repository.save(pod));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/venda-retroativa")
    public ResponseEntity<Pod> vendaRetroativa(@PathVariable Long id, @RequestParam String data, @RequestParam Integer quantidade) {
        return repository.findById(id).map(pod -> {
            pod.setVendidos(pod.getVendidos() + quantidade);
            for(int i = 0; i < quantidade; i++) {
                Venda novaVenda = new Venda();
                novaVenda.setMarca(pod.getMarca());
                novaVenda.setSabor(pod.getSabor());
                novaVenda.setFaturamento(pod.getPrecoVarejo());
                novaVenda.setLucro(pod.getPrecoVarejo() - pod.getPrecoAtacado());
                novaVenda.setDataVenda(LocalDate.parse(data));
                vendaRepository.save(novaVenda);
            }
            return ResponseEntity.ok(repository.save(pod));
        }).orElse(ResponseEntity.notFound().build());
    }
}