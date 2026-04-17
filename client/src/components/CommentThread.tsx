import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getUserDisplayName } from "@/utils/user";

export interface CommentThreadComment {
  id: string;
  opinionId: string;
  userId: string;
  content: string;
  likes: number;
  createdAt: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface CommentThreadProps {
  comments: CommentThreadComment[];
  currentUserId?: string;
  onEdit?: (comment: CommentThreadComment) => void;
  onDelete?: (comment: CommentThreadComment) => void;
  onReport?: (comment: CommentThreadComment) => void;
}

export default function CommentThread({ comments, currentUserId, onEdit, onDelete, onReport }: CommentThreadProps) {
  return (
    <div className="space-y-4" data-testid="comment-thread">
      {comments.map((comment) => (
        <CommentItem 
          key={comment.id} 
          comment={comment} 
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
          onReport={onReport}
        />
      ))}
    </div>
  );
}

interface CommentItemProps {
  comment: CommentThreadComment;
  currentUserId?: string;
  onEdit?: (comment: CommentThreadComment) => void;
  onDelete?: (comment: CommentThreadComment) => void;
  onReport?: (comment: CommentThreadComment) => void;
}

function CommentItem({ comment, currentUserId, onEdit, onDelete, onReport }: CommentItemProps) {
  const isAuthor = currentUserId === comment.userId;
  const displayName = getUserDisplayName(comment.displayName, comment.username);
  // Backend 응답에 comment id가 없으면(임시 id) 수정/삭제/신고 액션을 숨긴다.
  const hasStableId = !!comment.id && !comment.id.startsWith("comment-");
  const hasMenu = hasStableId && currentUserId && (isAuthor ? (onEdit || onDelete) : onReport);
  
  return (
    <div className="flex gap-3" data-testid={`comment-${comment.id}`}>
      <Avatar className="w-10 h-10">
        <AvatarImage src={comment.avatarUrl || undefined} />
        <AvatarFallback>{displayName[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-sm" data-testid={`text-author-${comment.id}`}>{displayName}</p>
            <p className="text-xs text-muted-foreground" data-testid={`text-time-${comment.id}`}>
              {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
          {hasMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  data-testid={`button-menu-${comment.id}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthor ? (
                  <>
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(comment)} data-testid={`button-edit-${comment.id}`}>
                        수정
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem onClick={() => onDelete(comment)} data-testid={`button-delete-${comment.id}`}>
                        삭제
                      </DropdownMenuItem>
                    )}
                  </>
                ) : (
                  onReport && (
                    <DropdownMenuItem onClick={() => onReport(comment)} data-testid={`button-report-${comment.id}`}>
                      <Flag className="h-4 w-4 mr-2" />
                      신고하기
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="text-sm" data-testid={`text-content-${comment.id}`}>{comment.content}</p>
      </div>
    </div>
  );
}
