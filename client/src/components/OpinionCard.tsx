import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare } from "lucide-react";
import { useState } from "react";

interface OpinionCardProps {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  timestamp: string;
  isAuthor?: boolean;
  onClick?: () => void;
}

export default function OpinionCard({
  id,
  authorName,
  authorAvatar,
  content,
  likeCount,
  commentCount,
  isLiked = false,
  timestamp,
  onClick,
}: OpinionCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  return (
    <Card
      className="p-4 cursor-pointer hover-elevate active-elevate-2"
      onClick={onClick}
      data-testid={`card-opinion-${id}`}
    >
      <div className="flex gap-3">
        <Avatar className="w-12 h-12" data-testid={`avatar-${id}`}>
          <AvatarImage src={authorAvatar} />
          <AvatarFallback>{authorName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div>
            <p className="font-medium" data-testid={`text-author-${id}`}>{authorName}</p>
            <p className="text-sm text-ok_txtgray1" data-testid={`text-time-${id}`}>{timestamp}</p>
          </div>
          <p className="text-base line-clamp-3" data-testid={`text-content-${id}`}>{content}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button
              className="flex items-center gap-1 hover-elevate active-elevate-2 px-2 py-1 rounded-md"
              onClick={handleLike}
              data-testid={`button-like-${id}`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current text-primary" : ""}`} />
              <span>{likes}</span>
            </button>
            <span className="flex items-center gap-1" data-testid={`text-comments-${id}`}>
              <MessageSquare className="w-4 h-4" />
              {commentCount}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
