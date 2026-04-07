package com.junseok.ocmaru;

import com.junseok.ocmaru.domain.cluster.job.ClusterJobProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(ClusterJobProperties.class)
public class OcmaruApplication {

	public static void main(String[] args) {
		SpringApplication.run(OcmaruApplication.class, args);
	}

}
