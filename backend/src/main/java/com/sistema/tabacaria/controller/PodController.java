package com.sistema.tabacaria.controller;

import com.sistema.tabacaria.model.Pod;
import com.sistema.tabacaria.model.Venda;
import com.sistema.tabacaria.repository.PodRepository;
import com.sistema.tabacaria.repository.VendaRepository;
import com.sistema.tabacaria.service.CaixaService;
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

    @Autowired
    private CaixaService caixaService;

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
    public ResponseEntity<Pod> venderPod(
            @PathVariable Long id,
            @RequestParam(required = false) Double precoPersonalizado,
            @RequestParam(required = false) String tipoVenda,
            @RequestParam(required = false) String dataVencimento) {
        return repository.findById(id).map(pod -> {
            if (pod.getEstoque() > 0) {
                pod.setEstoque(pod.getEstoque() - 1);
                pod.setVendidos(pod.getVendidos() + 1);

                Double precoFinal = (precoPersonalizado != null) ? precoPersonalizado : pod.getPrecoVarejo();
                boolean aPrazo = tipoVenda != null && tipoVenda.equals("A_PRAZO");
                String statusPagamento = aPrazo ? "A_PRAZO" : "PAGO";

                if (aPrazo && (dataVencimento == null || dataVencimento.isBlank())) {
                    return ResponseEntity.badRequest().body(pod);
                }

                Venda novaVenda = new Venda();
                novaVenda.setMarca(pod.getMarca());
                novaVenda.setSabor(pod.getSabor());
                novaVenda.setFaturamento(precoFinal);
                novaVenda.setLucro(precoFinal - pod.getPrecoAtacado());
                novaVenda.setDataVenda(LocalDate.now());
                novaVenda.setStatusPagamento(statusPagamento);
                if (aPrazo) {
                    novaVenda.setDataVencimento(LocalDate.parse(dataVencimento));
                }
                vendaRepository.save(novaVenda);

                if ("PAGO".equals(statusPagamento)) {
                    caixaService.registrarPagamento(precoFinal);
                }

                return ResponseEntity.ok(repository.save(pod));
            }
            return ResponseEntity.badRequest().body(pod);
        }).orElse(ResponseEntity.notFound().build());
    }

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

    @PutMapping("/{id}/desfazer-venda")
    public ResponseEntity<Pod> desfazerVenda(@PathVariable Long id) {
        return repository.findById(id).map(pod -> {
            if (pod.getVendidos() > 0) {
                pod.setEstoque(pod.getEstoque() + 1);
                pod.setVendidos(pod.getVendidos() - 1);

                List<Venda> vendas = vendaRepository.findAll();
                for (int i = vendas.size() - 1; i >= 0; i--) {
                    Venda v = vendas.get(i);
                    if (v.getMarca().equals(pod.getMarca()) && v.getSabor().equals(pod.getSabor())) {
                        if (!"A_PRAZO".equals(v.getStatusPagamento()) && v.getFaturamento() != null) {
                            caixaService.reverterPagamento(v.getFaturamento());
                        }
                        vendaRepository.delete(v);
                        break;
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
            for (int i = 0; i < quantidade; i++) {
                Venda novaVenda = new Venda();
                novaVenda.setMarca(pod.getMarca());
                novaVenda.setSabor(pod.getSabor());
                novaVenda.setFaturamento(pod.getPrecoVarejo());
                novaVenda.setLucro(pod.getPrecoVarejo() - pod.getPrecoAtacado());
                novaVenda.setDataVenda(LocalDate.parse(data));
                novaVenda.setStatusPagamento("PAGO");
                vendaRepository.save(novaVenda);
                caixaService.registrarPagamento(pod.getPrecoVarejo());
            }
            return ResponseEntity.ok(repository.save(pod));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/vendas/{id}")
    public ResponseEntity<String> desfazerVendaPorId(@PathVariable Long id) {
        return vendaRepository.findById(id).map(venda -> {
            List<Pod> pods = repository.findAll();
            for (Pod pod : pods) {
                if (pod.getMarca().equals(venda.getMarca()) && pod.getSabor().equals(venda.getSabor())) {
                    pod.setEstoque(pod.getEstoque() + 1);
                    pod.setVendidos(pod.getVendidos() > 0 ? pod.getVendidos() - 1 : 0);
                    repository.save(pod);
                    break;
                }
            }

            // Vendas antigas sem status (null) entram como pagas
            if (!"A_PRAZO".equals(venda.getStatusPagamento()) && venda.getFaturamento() != null) {
                caixaService.reverterPagamento(venda.getFaturamento());
            }

            vendaRepository.deleteById(id);
            return ResponseEntity.ok("Venda desfeita e estoque atualizado com sucesso!");
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Marca uma venda a prazo (fiado) como paga e atualiza o caixa.
     */
    @PutMapping("/vendas/{id}/pagar")
    public ResponseEntity<Venda> marcarVendaComoPaga(@PathVariable Long id) {
        return vendaRepository.findById(id).map(venda -> {
            if (!"A_PRAZO".equals(venda.getStatusPagamento())) {
                return ResponseEntity.badRequest().body(venda);
            }
            venda.setStatusPagamento("PAGO");
            Venda salva = vendaRepository.save(venda);
            if (venda.getFaturamento() != null) {
                caixaService.registrarPagamento(venda.getFaturamento());
            }
            return ResponseEntity.ok(salva);
        }).orElse(ResponseEntity.notFound().build());
    }
}
