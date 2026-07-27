import { useEffect, useRef, useState } from 'react';

export default function HitokotoCard() {
  const [from, setFrom] = useState('');
  const [fromVisible, setFromVisible] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const typingTimer = useRef<number | null>(null);

  useEffect(() => {
    const typewriter = (text: string, element: HTMLElement, onComplete: () => void) => {
      let i = 0;
      element.textContent = '';
      const typing = () => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          typingTimer.current = window.setTimeout(typing, 80);
        } else {
          onComplete();
        }
      };
      typing();
    };

    const render = (text: string, suffix: string) => {
      setFromVisible(false);
      if (!textRef.current) return;
      typewriter(text, textRef.current, () => {
        setFrom(suffix);
        setFromVisible(true);
      });
    };

    const fetchAndShow = async () => {
      try {
        const response = await fetch('https://v1.hitokoto.cn/?encode=json&charset=utf-8');
        if (!response.ok) throw new Error('Hitokoto API request failed');
        const data = await response.json();
        const fromWho = data.from_who ? data.from_who : '';
        const src = data.from ? data.from : '';
        const suffix = `—— ${fromWho}${src ? `「${src}」` : ''}`;
        render(data.hitokoto, suffix);
      } catch {
        render('生活，就是一半烟火，一半清欢。', '');
      }
    };

    fetchAndShow();
    const interval = window.setInterval(fetchAndShow, 10000);
    return () => {
      window.clearInterval(interval);
      if (typingTimer.current) window.clearTimeout(typingTimer.current);
    };
  }, []);

  return (
    <div id="hitokoto-card" className="card card--tertiary glass tilt-card">
      <div className="music-player-container">
        <div className="music-header">
          <i className="fa-solid fa-quote-left"></i>
          <span>Hitokoto</span>
        </div>
        <div className="music-content">
          <div className="hitokoto-container">
            <p className="hitokoto-text" ref={textRef}></p><span className="cursor"></span>
            <p className="hitokoto-from" style={{ opacity: fromVisible ? '1' : '0' }}>{from}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
