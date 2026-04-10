export async function analyzeContent(input) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // TODO: Replace this mock with real API call:
  // const formData = new FormData();
  // formData.append('pdf', file);
  // const res = await fetch('http://localhost:3000/analyze-pdf', {
  //   method: 'POST',
  //   body: formData
  // });
  // return await res.json();

  return {
    summary:
      'This document provides a comprehensive overview of machine learning fundamentals. It covers the three primary paradigms: supervised learning (where models learn from labeled data), unsupervised learning (finding hidden patterns in unlabeled data), and reinforcement learning (learning through reward-based interaction). The text emphasizes practical applications in modern AI systems, discussing neural network architectures, training methodologies, and real-world deployment considerations.',

    topics: [
      'Machine Learning',
      'Neural Networks',
      'Supervised Learning',
      'Deep Learning',
      'Data Science'
    ],

    questions: [
      {
        question: 'What are the three main paradigms of machine learning?',
        answer:
          'Supervised learning, unsupervised learning, and reinforcement learning.'
      },
      {
        question: 'What distinguishes supervised from unsupervised learning?',
        answer:
          'Supervised learning uses labeled training data, while unsupervised learning finds patterns in unlabeled data without predefined outputs.'
      },
      {
        question: 'How does reinforcement learning differ from other ML types?',
        answer:
          'It learns through interaction with an environment, receiving rewards or penalties for actions, rather than from a static dataset.'
      }
    ]
  };
}

