package com.junseok.ocmaru.dev;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.seed")
public class OpinionDataSeederProperties {

  private boolean enabled = false;
  private int userCount = 100;
  private int opinionsPerUser = 50;
  private int clustersPerAgenda = 2;
  private int bookmarkUsersMax = 8;
  private int votersPerAgendaMax = 15;
  private int opinionLikesMax = 80;
  private int opinionCommentsMax = 40;
  private int agendaViewCount1 = 1023;
  private int agendaViewCount2 = 754;
  private int agendaViewCount3 = 389;
  private int clusterSimilarityBase = 72;
  private int clusterSimilaritySpread = 8;

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public int getUserCount() {
    return userCount;
  }

  public void setUserCount(int userCount) {
    this.userCount = userCount;
  }

  public int getOpinionsPerUser() {
    return opinionsPerUser;
  }

  public void setOpinionsPerUser(int opinionsPerUser) {
    this.opinionsPerUser = opinionsPerUser;
  }

  public int getClustersPerAgenda() {
    return clustersPerAgenda;
  }

  public void setClustersPerAgenda(int clustersPerAgenda) {
    this.clustersPerAgenda = clustersPerAgenda;
  }

  public int getBookmarkUsersMax() {
    return bookmarkUsersMax;
  }

  public void setBookmarkUsersMax(int bookmarkUsersMax) {
    this.bookmarkUsersMax = bookmarkUsersMax;
  }

  public int getVotersPerAgendaMax() {
    return votersPerAgendaMax;
  }

  public void setVotersPerAgendaMax(int votersPerAgendaMax) {
    this.votersPerAgendaMax = votersPerAgendaMax;
  }

  public int getOpinionLikesMax() {
    return opinionLikesMax;
  }

  public void setOpinionLikesMax(int opinionLikesMax) {
    this.opinionLikesMax = opinionLikesMax;
  }

  public int getOpinionCommentsMax() {
    return opinionCommentsMax;
  }

  public void setOpinionCommentsMax(int opinionCommentsMax) {
    this.opinionCommentsMax = opinionCommentsMax;
  }

  public int getAgendaViewCount1() {
    return agendaViewCount1;
  }

  public void setAgendaViewCount1(int agendaViewCount1) {
    this.agendaViewCount1 = agendaViewCount1;
  }

  public int getAgendaViewCount2() {
    return agendaViewCount2;
  }

  public void setAgendaViewCount2(int agendaViewCount2) {
    this.agendaViewCount2 = agendaViewCount2;
  }

  public int getAgendaViewCount3() {
    return agendaViewCount3;
  }

  public void setAgendaViewCount3(int agendaViewCount3) {
    this.agendaViewCount3 = agendaViewCount3;
  }

  public int getClusterSimilarityBase() {
    return clusterSimilarityBase;
  }

  public void setClusterSimilarityBase(int clusterSimilarityBase) {
    this.clusterSimilarityBase = clusterSimilarityBase;
  }

  public int getClusterSimilaritySpread() {
    return clusterSimilaritySpread;
  }

  public void setClusterSimilaritySpread(int clusterSimilaritySpread) {
    this.clusterSimilaritySpread = clusterSimilaritySpread;
  }
}
