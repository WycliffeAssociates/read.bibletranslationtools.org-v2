interface testProps {
  message?: string;
}
export default function Test(props: testProps) {
  return <div>I am a test {props.message}</div>;
}
