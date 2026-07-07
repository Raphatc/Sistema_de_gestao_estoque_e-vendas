# Etapa 1: Preparar e Compilar
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copia os arquivos do projeto
COPY . .

# Faz a compilação do Spring Boot (ignorando os testes)
RUN mvn clean package -DskipTests
RUN mv target/*.jar app.jar

# Etapa 2: Criar o Servidor Leve e Rápido
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Pega apenas o pacote final pronto da etapa anterior
COPY --from=build /app/app.jar .

# Expõe a porta de comunicação
EXPOSE 8080

# Liga o motor do Spring Boot
ENTRYPOINT ["java", "-jar", "app.jar"]