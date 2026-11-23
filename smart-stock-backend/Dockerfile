# Estágio 1: Build com Maven Wrapper e JDK 21 (Noble)
FROM eclipse-temurin:21-jdk-noble AS build
WORKDIR /app

# Cache de dependências antes de copiar o código-fonte
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw dependency:go-offline -B

# Build do JAR sem rodar testes (testes rodam fora do build da imagem)
COPY src src
RUN ./mvnw package -DskipTests -B

# Estágio 2: Runtime apenas com JRE 21 (Alpine) e usuário não-root
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build --chown=appuser:appgroup /app/target/*.jar app.jar

USER appuser:appgroup

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
