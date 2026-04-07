package com.junseok.ocmaru.infra.openai;

import com.junseok.ocmaru.domain.cluster.dto.ClusterMetadataDto;
import java.util.List;

public interface ClusterMetadataClient {
  ClusterMetadataDto generateMetadata(List<String> opinions);
}
