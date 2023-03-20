import { API } from './api';

export default function Username({
  link,
  name,
}: {
  link: string;
  name: string;
}) {
  return (
    <a
      className="link"
      href={link}
      target="_blank"
    >
      {name}
    </a>
  );
}
