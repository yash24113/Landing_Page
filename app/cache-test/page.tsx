export const dynamic = 'force-static';
export const revalidate = 60;

export default function Page() {
  return <pre>{new Date().toISOString()}</pre>;
}
