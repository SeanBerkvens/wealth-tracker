type WealthCardProps = {
  title: string;
  value: string;
};

export default function WealthCard({
  title,
  value,
}: WealthCardProps) {
  return (
    <div className="rounded-xl border p-6 shadow-sm">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h2 className="mt-2 text-3xl font-bold">
        {value}
      </h2>
    </div>
  );
}