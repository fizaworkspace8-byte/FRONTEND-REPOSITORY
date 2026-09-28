import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';

export default function PlaceholderPage({ title, description, icon }) {
  return (
    <div className="animate-fade-up">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title="Not implemented yet"
        description="This screen is intentionally scaffolded. It will become a working vertical slice in the stage listed in the roadmap."
      />
    </div>
  );
}