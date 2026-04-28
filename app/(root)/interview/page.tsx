import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
  const user = await getCurrentUser();
  
  return (
    <>
      <h3>Generate Interview</h3>
      <p className="text-gray-400 mb-6">
        Answer the AI's questions to generate your interview
      </p>
      <Agent
        userName={user?.name!}
        userId={user?.id}
        type="generate"
      />
    </>
  );
};

export default Page;