// Floating Chatbot — OpenRouter/Gemini style
// Note: For security, don't expose real keys in public repos. Here it's per your request.
(function(){
	const panel = document.getElementById('chatbot-panel');
	const toggleBtn = document.getElementById('chatbot-toggle');
	const closeBtn = document.getElementById('chatbot-close');
	if(!toggleBtn || !panel) return;

	const messagesEl = document.getElementById('chatbot-messages');
	const form = document.getElementById('chatbot-form');
	const input = document.getElementById('chatbot-input');
		// Always use this default key (embedded by user request)
		const DEFAULT_KEY = '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';

	function appendMsg(role, text){
		if(!messagesEl) return;
		const wrap = document.createElement('div');
		wrap.className = `chatbot-msg ${role}`;
		const bubble = document.createElement('div');
		bubble.className = 'bubble';
		bubble.textContent = text;
		wrap.appendChild(bubble);
		messagesEl.appendChild(wrap);
		messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	function systemPreamble(){
		// Strictly limit scope to the provided profile only
		return (
			"You are an assistant that ONLY answers questions about the person driss khalfaoui and don't talk outside of the subject. " +
			"If the user asks about anything else, reply briefly: don't be outside of the subject!.'" +
			"\nUse the profile below as the ONLY source of truth. Answer in the language of the user's question.\n\n" +
			"PROFILE:\n" +
			"Name: Khalfaoui Driss\n" +
			"Role: Full Stack Developer (2 years experience)\n" +
			"Address: N 1 RUE 6 BLOC E MERJA OUAD, Fès, Maroc | Rabat\n" +
			"Phone: +212 68100-5669\n" +
			"Email: drisspaca4@gmail.com\n" +
			"Education: Moulay Ali Shrif; Salah Din Al Ayoubi; AMESIP; Academic level: Niveau Bac; 1337 School – 42 Network (2024-2025, Rabat): Software Engineer student\n" +
			"Languages: French, English, Arabic\n" +
			"Experience: Full Stack Developer (2 years)\n" +
			"Skills: HTML, CSS, JavaScript, Python, C, PHP, SQL; jQuery, AJAX, JSON; Bash, VS Code; Bootstrap, Tailwind; Microsoft Office (Word, Excel, PowerPoint); Design: Photoshop, After Effects, Illustrator, Premiere Pro; Soft skills: Organization, Communication, Teamwork, Meeting Deadlines, Critical Thinking\n" +
			"Projects: libft, ft_printf, get_next_line, born2root, push_swap, minitalk, so_long, minishell, philosopher, admin_management\n" +
			"When asked to generate a CV, keep it professional and concise."
		);
	}

	async function callOpenRouter(prompt){
		const apiKey = DEFAULT_KEY;
		if (!apiKey) throw new Error('Missing OpenRouter API key');
		const headers = {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
			'X-Title': 'Driss Profile Chatbot'
		};
		try {
			if (typeof location?.origin === 'string' && /^https?:\/\//.test(location.origin)){
				headers['HTTP-Referer'] = location.origin;
			}
		} catch {}
		async function requestOnce(maxTokens){
			const body = {
				model: 'google/gemini-2.0-flash-lite-001',
				max_tokens: maxTokens,
				temperature: 0.2,
				messages: [
					{ role: 'system', content: systemPreamble() },
					{ role: 'user', content: prompt }
				]
			};
			const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
				method: 'POST', headers, body: JSON.stringify(body)
			});
			if (!res.ok){
				const status = res.status;
				let errText = '';
				try { errText = await res.text(); } catch {}
				const msg = `AI request failed (${status}) ${errText?.slice(0,200)}`;
				const e = new Error(msg); e.status = status; e.details = errText; throw e;
			}
			const json = await res.json();
			const text = json?.choices?.[0]?.message?.content || '';
			return text.trim();
		}
		try {
			return await requestOnce(500);
		} catch (e){
			if (e?.status === 402){
				try { return await requestOnce(250); } catch {}
				throw new Error('Payment or token limit error. Try fewer tokens or add credits.');
			}
			throw e;
		}
	}

	function openPanel(){ panel.hidden = false; setTimeout(()=>{ input?.focus(); }, 50); }
	function closePanel(){ panel.hidden = true; }
	toggleBtn.addEventListener('click', openPanel);
	closeBtn?.addEventListener('click', closePanel);

	// Seed greeting
	appendMsg('ai', 'Hello! Ask me anything about Khalfaoui Driss.');

	form?.addEventListener('submit', async (e)=>{
		e.preventDefault();
		const q = (input?.value || '').trim();
		if(!q) return;
		appendMsg('user', q);
		input.value = '';
		const waitId = setTimeout(()=>appendMsg('ai', '...'), 600);
		try {
			const ans = await callOpenRouter(q);
			clearTimeout(waitId);
			appendMsg('ai', ans || '');
		} catch(err){
			clearTimeout(waitId);
			appendMsg('ai', (err && (err.message||err.toString())) || 'Error.');
		}
	});
})();

