# 📱 Pledge – Take Control of Your Digital Life  

Pledge is a bold, fun, and effective way to beat social media addiction. If you’ve ever felt that your phone has a tighter grip on your time than you’d like, this is your call to break free. We believe your time is too valuable to be lost in the endless scroll, so we built Pledge – a small step towards a life less distracted and more fulfilling. 🌱

## 🚀 Features  
- **Set Daily Limits** – Choose how much time you want to spend on social media each day.  
- **Financial Accountability** – If you go over your limit, make a real-world pledge to a charity you care about (because nothing says ‘I’m serious’ like putting your money where your thumbs are). 💸  
- **Behavioral Nudges** – Get timely reminders to stay on track, inspired by the latest research in behavioral science and digital wellness.  
- **Progress Tracking** – Visualize your progress and see how much time you’ve taken back.  
- **Seamless Integration** – Works with the apps you use most, without compromising your privacy.  
## 🎥 Demo
Check out the demo below to see Pledge in action:

[![Pledge Demo](https://img.youtube.com/vi/8_fCuFwVfUE/0.jpg)](https://www.youtube.com/shorts/8_fCuFwVfUE)

## 📚 Why Pledge?  
Pledge isn’t just another screen time tracker. It’s a commitment to yourself, backed by science and designed to genuinely help you change your digital habits. Whether you’re a serial scroller or just looking for a gentle nudge, Pledge helps you reclaim your time without the guilt.  

## 🤝 Contributing  
Pledge is open to contributions from anyone passionate about mental health and digital wellbeing. If you have ideas, fixes, or just want to lend a hand, feel free to open a PR.  

## ❤️ Support the Mission  
If Pledge has made a positive impact on your life, consider supporting the project by sharing it with your friends or contributing to its growth.  

## 📧 Contact  
Got questions, feedback, or just want to chat about digital wellness? Reach out at mateoploquina@gmail.com



**Break the cycle. Take the Pledge.**

---

## For developers

Pick apps, set a daily limit, choose 7/15/30 days, put a card down. Keep your
word and nothing is charged.

Start with `CLAUDE.md` (map for agents and humans), then `docs/`:

- `docs/product.md`: what the app does, screen by screen, decisions and open questions
- `docs/design.md`: look, motion, copy voice, tokens
- `docs/architecture.md`: stack, native targets, backend, Apple limits, dev loop, gotchas
- `docs/release.md`: TestFlight / App Store procedure and status
- `docs/app-review-notes.md`: notes for App Review

### Run on the phone

```sh
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
npm install                      # runs patch-package
npx expo prebuild --platform ios --no-install && (cd ios && pod install)
npx expo start --dev-client --tunnel
```

Then build and install with xcodebuild/devicectl as in `docs/architecture.md`.
Screen Time does not work in the simulator.

### Store builds

```sh
npx eas build --platform ios --profile production --non-interactive
npx eas submit --platform ios --latest
```
