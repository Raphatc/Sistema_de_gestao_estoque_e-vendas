package com.sistema.tabacaria.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults()) // Permite que o Next.js converse com o Java
                .csrf(csrf -> csrf.disable())    // Desativa proteção CSRF (necessário para APIs REST)
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().authenticated() // BLOQUEIA TUDO: Só entra quem estiver logado
                )
                .httpBasic(Customizer.withDefaults()); // Configura a autenticação básica via cabeçalho

        return http.build();
    }

    // AQUI VOCÊ DEFINE OS 3 USUÁRIOS OFICIAIS DO SISTEMA
    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails dono = User.builder()
                .username("Rafael")
                .password(passwordEncoder().encode("Pod010203$")) // Troque "senha123" pela sua senha
                .roles("ADMIN")
                .build();

        UserDetails socio1 = User.builder()
                .username("Baiano")
                .password(passwordEncoder().encode("Pod010203$"))
                .roles("ADMIN")
                .build();

        UserDetails socio2 = User.builder()
                .username("Amanda")
                .password(passwordEncoder().encode("Pod010203$"))
                .roles("ADMIN")
                .build();

        return new InMemoryUserDetailsManager(dono, socio1, socio2);
    }

    // Criptografa as senhas na memória para segurança máxima
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Libera a passagem APENAS para o endereço do seu Next.js
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Quando for colocar na internet de verdade, colocaremos o link oficial do site aqui:
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}