import { useCallback, useState } from 'react';
import { CATEGORY_CONFIG, type Category } from '@lib/categories';
import TwoRivers from '@components/transitions/TwoRivers';

interface Props {
  href: string;
  children: React.ReactNode;
  fromCategory: Category;
  toCategory?: Category;
}

export default function InlineLink({ href, children, fromCategory, toCategory }: Props) {
  const [transition, setTransition] = useState<{
    from: string;
    to: string;
    href: string;
  } | null>(null);

  const cross = toCategory && toCategory !== fromCategory;

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!cross || !toCategory) return; // let browser handle same-category
      e.preventDefault();
      const fromCfg = CATEGORY_CONFIG[fromCategory];
      const toCfg = CATEGORY_CONFIG[toCategory];
      setTransition({
        from: fromCfg.primary,
        to: toCfg.primary,
        href,
      });
    },
    [cross, fromCategory, toCategory, href],
  );

  return (
    <>
      <a href={href} onClick={onClick} data-cross={cross ? '' : undefined}>
        {children}
      </a>
      {transition && (
        <TwoRivers
          fromColor={transition.from}
          toColor={transition.to}
          href={transition.href}
        />
      )}
    </>
  );
}
