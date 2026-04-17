import VotingWidget from "../VotingWidget";

export default function VotingWidgetExample() {
  return (
    <div className="p-6 max-w-2xl">
      <VotingWidget
        agreeCount={156}
        neutralCount={34}
        disagreeCount={23}
        userVote="agree"
        onVote={(vote) => console.log("User voted:", vote)}
      />
    </div>
  );
}
