package com.junseok.ocmaru.domain.agenda.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.FetchType;
import java.util.ArrayList;
import java.util.List;

@Embeddable
public class AgendaReferences {

  @ElementCollection(fetch = FetchType.LAZY)
  @Column(name = "link")
  private List<String> referenceLinks = new ArrayList<>();

  private String okinewsUrl;

  @ElementCollection(fetch = FetchType.LAZY)
  @CollectionTable
  @Column(name = "file")
  // @AttributeOverride
  // @OrderColumn
  private List<String> referenceFiles = new ArrayList<>();

  @ElementCollection
  @Column(name = "tag")
  private List<String> tags = new ArrayList<>();

  public void setReferenceLinks(List<String> referenceLinks) {
    this.referenceLinks = referenceLinks != null ? referenceLinks : new ArrayList<>();
  }

  public void setReferenceFiles(List<String> referenceFiles) {
    this.referenceFiles = referenceFiles != null ? referenceFiles : new ArrayList<>();
  }

  public void addReferenceFile(String fileUrl) {
    if (fileUrl == null || fileUrl.isBlank()) {
      return;
    }
    this.referenceFiles.add(fileUrl);
  }
}
