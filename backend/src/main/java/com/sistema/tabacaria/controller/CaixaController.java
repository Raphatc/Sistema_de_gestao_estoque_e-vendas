package com.sistema.tabacaria.controller;

import com.sistema.tabacaria.model.Caixa;
import com.sistema.tabacaria.service.CaixaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/caixa")
@CrossOrigin(origins = "*")
public class CaixaController {

    @Autowired
    private CaixaService caixaService;

    @GetMapping
    public Caixa getCaixa() {
        return caixaService.getOrCreate();
    }

    /**
     * Atualiza saldo e gasto com mercadoria.
     * Por padrão, a dívida acompanha só a variação do gasto (não zera abatimentos).
     * Com recalcularDivida=true, redefine dívida = max(0, gasto - saldo).
     */
    @PutMapping
    public Caixa atualizarCaixa(
            @RequestBody Caixa novoCaixa,
            @RequestParam(required = false, defaultValue = "false") boolean recalcularDivida) {
        return caixaService.atualizar(
                novoCaixa.getSaldo(),
                novoCaixa.getGastoMercadoria(),
                recalcularDivida
        );
    }
}
