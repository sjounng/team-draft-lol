package com.example.teamdraftlol;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		ConfigurableApplicationContext context = SpringApplication.run(BackendApplication.class, args);
		
		// Graceful shutdown hook 추가
		Runtime.getRuntime().addShutdownHook(new Thread(() -> {
			System.out.println("애플리케이션 종료 중... 데이터베이스 연결을 정리합니다.");
			context.close();
		}));
	}

}
