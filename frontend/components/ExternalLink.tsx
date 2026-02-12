import type { ComponentChildren } from 'preact';

interface ExternalLinkProps {
  href: string;
  children: ComponentChildren;
  class?: string;
}

/**
 * A secure external link component that adds rel="noopener noreferrer"
 * and target="_blank" to links pointing to external sites.
 *
 * This prevents:
 * - window.opener attacks (noopener)
 * - Referer header leakage (noreferrer)
 *
 * @see https://web.dev/external-anchors-use-rel-noopener/
 */
export default function ExternalLink({ href, children, class: className }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      class={className}
    >
      {children}
    </a>
  );
}
