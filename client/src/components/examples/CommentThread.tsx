import CommentThread from "../CommentThread";

export default function CommentThreadExample() {
  const comments = [
    {
      id: "1",
      authorName: "박민수",
      content: "저도 같은 문제를 겪고 있습니다. 빠른 조치 부탁드립니다.",
      likeCount: 5,
      isLiked: true,
      timestamp: "1시간 전",
    },
    {
      id: "2",
      authorName: "최지영",
      content: "좋은 의견이네요. 저도 동의합니다!",
      likeCount: 3,
      timestamp: "3시간 전",
    },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <CommentThread comments={comments} />
    </div>
  );
}
