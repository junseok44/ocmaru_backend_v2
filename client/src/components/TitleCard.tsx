  interface TitleCardProps {
    title: string;
    description: string;
  }

  export default function TitleCard({ title, description }: TitleCardProps){
    return(
      <div className="text-center py-[50px] mb-[50px] space-y-4">
      <h1 className="text-3xl md:text-4xl font-bold text-ok_txtgray2">
        {title}
      </h1>
      <p className="text-ok_txtgray1 text-lg">
        {description}
      </p>
      </div>
    );
  }