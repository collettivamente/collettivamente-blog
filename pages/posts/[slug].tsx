import { GetStaticProps, GetStaticPaths } from 'next'
import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import { useEffect, useState } from 'react'
import Container from '../../components/container'
import PostBody from '../../components/post-body'
import Header from '../../components/header'
import PostHeader from '../../components/post-header'
import Layout from '../../components/layout'
import PostTitle from '../../components/post-title'
import Head from 'next/head'
import { staticRequest, getStaticPropsForTina } from 'tinacms'
import { CMS_NAME } from '../../lib/constants'
import markdownToHtml from '../../lib/markdownToHtml'

interface Data {
  getPostsDocument: {
    data: {
      title: string;
      excerpt: string;
      date: string;
      coverImage: string;
      author: {
        name: string;
        picture: string;
      };
      ogImage: {
        url: string;
      };
      body: string;
    }
  }
}

const Post: React.FC<{ data: Data, slug: string}> = ({ data, slug }) => {
  const {
    title,
    coverImage,
    date,
    author,
    body,
    ogImage
  } = data.getPostsDocument.data

  const router = useRouter()
  const [content, setContent] = useState('')
  useEffect(() => {
    const parseMarkdown = async () => {
      setContent(await markdownToHtml(body))  
    }

    parseMarkdown()
  }, [body]);

  if (!router.isFallback && !slug) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <Layout preview={false}>
      <Container>
        <Header />
        {router.isFallback ? (
          <PostTitle>Loading…</PostTitle>
        ) : (
          <>
            <article className="mb-32">
              <Head>
                <title>
                  {title} | Next.js Blog Example with {CMS_NAME}
                </title>
                <meta property="og:image" content={ogImage.url} />
              </Head>
              <PostHeader
                title={title}
                coverImage={coverImage}
                date={date}
                author={author}
              />
              <PostBody content={content} />
            </article>
          </>
        )}
      </Container>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps<Data, { slug: string }> = async ({ params }) => {
  const { slug } = params!;
  const variables = { relarivePath: `${slug}.md` };
  const tinaProps = await getStaticPropsForTina({
    query: `
      query BlogPostQuery($relativePath: String!) {
        getPostsDocument(relativePath: $relativePath) {
          data {
            title
            excerpt
            date
            coverImage
            author {
              name
              picture
            }
            ogImage {
              url
            }
            body
          }
        }
      }
    `,
    variables
  })

  return {
    props: {
      ...tinaProps,
      slug,
    }
  }
}

type PostListData = {
  getPostsList: {
    edges: {
      node: {
        sys: {
          filename: string,
        }
      }
    }[]
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  const postListData = await staticRequest({
    query: `
      query {
        getPostsList {
          edges {
            node {
              sys {
                filename
              }
            }
          }
        }
      }
    `,
    variables: {},
  })

  return {
    paths: (postListData as PostListData).getPostsList.edges.map(edge => ({
      params: { slug: edge.node.sys.filename },
    })),
    fallback: false
  };
}
