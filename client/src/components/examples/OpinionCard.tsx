import OpinionCard from "../OpinionCard";

export default function OpinionCardExample() {
  return (
    <div className="p-6 space-y-4">
      <OpinionCard
        id="1"
        authorName="김철수"
        content="A초등학교 앞 도로가 너무 위험합니다. 아이들이 등하교할 때 차량 속도가 너무 빠르고, 횡단보도도 부족합니다. 과속방지턱과 신호등 설치가 시급합니다."
        likeCount={12}
        commentCount={5}
        isLiked={true}
        timestamp="2시간 전"
        isAuthor={true}
        onClick={() => console.log("Opinion clicked")}
      />
      <OpinionCard
        id="2"
        authorName="이영희"
        content="우리 동네 공원에서 밤늦게까지 술 마시고 소란을 피우는 사람들이 많아서 잠을 잘 수가 없습니다."
        likeCount={8}
        commentCount={3}
        timestamp="5시간 전"
        onClick={() => console.log("Opinion clicked")}
      />
    </div>
  );
}
