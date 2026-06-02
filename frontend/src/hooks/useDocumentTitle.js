import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    const defaultTitle = 'Amazon Orders Architecture';
    document.title = title ? `${title} | ${defaultTitle}` : defaultTitle;

    return () => {
      document.title = defaultTitle;
    };
  }, [title]);
};

export default useDocumentTitle;
