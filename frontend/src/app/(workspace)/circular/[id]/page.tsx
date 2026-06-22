import CircularWorkflow from "@/components/CircularWorkflow";

type CircularPageProps = {
  params: { id: string };
};

export default function CircularPage({ params }: CircularPageProps) {
  return <CircularWorkflow id={params.id} />;
}
