import type { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>ONXZA</span>,
  project: {
    link: 'https://github.com/devgru-us/onxza',
  },
  docsRepositoryBase: 'https://github.com/devgru-us/onxza/tree/main/docs-site',
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="ONXZA — Open-source AI Agent Orchestration Platform" />
      <meta name="og:title" content="ONXZA Documentation" />
    </>
  ),
  footer: {
    content: (
      <span>
        © {new Date().getFullYear()}{' '}
        <a href="https://devgru.us" target="_blank" rel="noopener noreferrer">
          DevGru Technology Products
        </a>
        . ONXZA is open source under MIT License.
      </span>
    ),
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
}

export default config
