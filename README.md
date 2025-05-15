# 📱 Pledge – Take Control of Your Digital Life  

Pledge is a bold, fun, and effective way to beat social media addiction. If you’ve ever felt that your phone has a tighter grip on your time than you’d like, this is your call to break free. We believe your time is too valuable to be lost in the endless scroll, so we built Pledge – a small step towards a life less distracted and more fulfilling. 🌱

## 🚀 Features  
- **Set Daily Limits** – Choose how much time you want to spend on social media each day.  
- **Financial Accountability** – If you go over your limit, make a real-world pledge to a charity you care about (because nothing says ‘I’m serious’ like putting your money where your thumbs are). 💸  
- **Behavioral Nudges** – Get timely reminders to stay on track, inspired by the latest research in behavioral science and digital wellness.  
- **Progress Tracking** – Visualize your progress and see how much time you’ve taken back.  
- **Seamless Integration** – Works with the apps you use most, without compromising your privacy.  

## 📚 Why Pledge?  
Pledge isn’t just another screen time tracker. It’s a commitment to yourself, backed by science and designed to genuinely help you change your digital habits. Whether you’re a serial scroller or just looking for a gentle nudge, Pledge helps you reclaim your time without the guilt.  

## 📦 Installation  
```
git clone https://github.com/your-username/pledge.git  
cd pledge  
npm install  
npm run ios  
```

## 🛠️ Tech Stack  
- React Native (Expo)  
- TypeScript  
- Firebase  
- Node.js (for backend magic)  

## 🤝 Contributing  
Pledge is open to contributions from anyone passionate about mental health and digital wellbeing. If you have ideas, fixes, or just want to lend a hand, feel free to open a PR.  

## ❤️ Support the Mission  
If Pledge has made a positive impact on your life, consider supporting the project by sharing it with your friends or contributing to its growth.  

## 📧 Contact  
Got questions, feedback, or just want to chat about digital wellness? Reach out at mateoploquina@gmail.com



**Break the cycle. Take the Pledge.**









--------------------------------------------------------



cd pledge-app
## Prerequisites

You need to use at least `nvm` > 18:
```sh
nvm use 18
```

## Run the App in the Simulator

To run the app in the simulator, use:
```sh
npx expo run:[ios or android] or npm run [ios or android]
```
The App extensions are currently built only for IOS so the app will no work well on Android.

## Export to Transporter for TestFlight

To export it to Transporter and get it on TestFlight, you need to use `EAS`:
```sh
eas build --platform [ios or android] --profile development
```
