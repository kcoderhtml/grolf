# Grolf: HC's favorite (and only) commit bot

![Hours spent working on this](https://w.dunkirk.sh/api/badge/krn/interval:any/project:grolf) ![GitHub repo size](https://img.shields.io/github/repo-size/kcoderhtml/grolf)
![GitHub language count](https://img.shields.io/github/languages/count/kcoderhtml/grolf)
![GitHub top language](https://img.shields.io/github/languages/top/kcoderhtml/grolf)
![GitHub last commit](https://img.shields.io/github/last-commit/kcoderhtml/grolf)

<img src="https://github.com/kcoderhtml/grolf/raw/master/.github/images/grolf-thread.png" align="left" width="200" style="padding-right: 3rem"/>
Your friendly lightweight arcade helper written in Bun and hosted on nest! 😎

</br>
</br>

If you've never used grolf before and are curious what it is then here's the TDLR: Grolf is a slack app that acts as an air traffic control room basicaly for your github commits. It takes in webhooks from github for every commit you push to github and then redirects them to the proper arcade thread on slack. It also has pretty graphs all made out of asci and a super nice logging system originaly developed by [@jaspermayone](https://github.com/jaspermayone) for the https://github.com/hackclub/arcadius and https://github.com/hackclub/professor-bloom slack bots.

<img src="https://github.com/kcoderhtml/grolf/raw/master/.github/images/grolf.jpg" align="right" width="200"/>

_Claim to fame: I demoed this to the founder of Github!_

This ended up being probably my biggest project during arcade and I really enjoyed working on it! While it definetly had quite a few bumps along the way (dropped the db about 5 times i think?) overall it worked way better than I expected and (i think) its been a pretty big hit so far!

If I were to do this over again I would probably end up using a different slack bot structuring. I definetly refined how I like making slackbot with this project and ended up creating https://github.com/kcoderhtml/slackbot-ultimate-template based off what I learned from this project. The beauty of code is that it can always be improved and I plan on doing so with that template!

I'm also going to continue maintaining this, fixing any issues that get reported, and, hopefully, it will be usefull again sometime in the future!

## Usage on slack

<details>
  <summary>Expand here for the first time setup instructions on the slack side (if you want to know how to use the bot this is for you)</summary>

  <br/>

First you need to create a new arcade session like below:  
 ![arcade session](https://github.com/kcoderhtml/grolf/raw/master/.github/images/arcade-thread.png)  
 Next click the three dots next to your thread's top message  
 ![message actions popup](https://github.com/kcoderhtml/grolf/raw/master/.github/images/arcade-message-shortcuts.png)  
 Now click the message shortcuts button and search for `fetch grolf` in the popup  
 ![the message shortcuts popup](https://github.com/kcoderhtml/grolf/raw/master/.github/images/messasge-shortcuts.png)  
 Now click the fetch grolf shortcut and follow the instructions grolf gives you to authorize your acount with github (if there was a database reset and you need to do this again then enter your github username in the popup follow the link displayed to install grolf and then delete the grolf app from your github acount then reinstall it acording to grolf's instructions)  
 ![grolf's github login popup](https://github.com/kcoderhtml/grolf/raw/master/.github/images/grolf-github-login.png)  
 When installing the grolf app I recommend checking all repositories so that grolf will just work regardless of what you are working on but you can also chose specific repositories if you feel more comfortable that way.  
 ![grolf github installation](https://github.com/kcoderhtml/grolf/raw/master/.github/images/grolf-github-install.png)  
 Grolf will now send a message in your arcade thread and you are good to go!  
 ![grolf listening message](https://github.com/kcoderhtml/grolf/raw/master/.github/images/grolf-listening-message.png)

</details>

<br/>

If you ever need to change your github username and update that in grolf then just run the command `/tellgrolf` and follow the instructions

## Creating the apps

You need a slack app with the following manifest

```yaml
display_information:
    name: Grolf
    description: This grolf has a special Fähigkeiten which is to grab your git commits and plop them somewhere
    background_color: '#203020'
    long_description: They call me Grolf, though whispers in the forest say I'm born from moonlight and fallen leaves. I wouldn't know, honestly, my memories start with the damp earth and the sweet smell of moss. I'm not much to look at, a furry green fellow with a single, bright leaf sprouting from my back. But don't let that fool you! Lately, I feel a strange pull towards the programmers' world, a place buzzing with light and strange symbols. Sometimes, I can't resist grabbing a sparkly wisp of code from their machines and dropping it right in their online hangout. They get flustered, these programmers, but hey, a little chaos never hurt anyone, right? Besides, who knows, maybe they'll find a missing piece of their puzzle in my little gifts.
features:
    bot_user:
        display_name: Grolf
        always_online: false
    shortcuts:
        - name: grolf fetch
          type: message
          callback_id: fetch
          description: Send grolf to go gather your commits and return with them to this thread!
    slash_commands:
        - command: /tellgrolf
          url: https://casual-renewing-reptile.ngrok-free.app/slack
          description: Tell grolf you want to change your user name!
          should_escape: false
oauth_config:
    scopes:
        bot:
            - chat:write
            - chat:write.public
            - commands
            - links:write
            - users.profile:read
            - users:read
settings:
    interactivity:
        is_enabled: true
        request_url: https://your-app-url.ngrok-free.app/slack
    org_deploy_enabled: false
    socket_mode_enabled: false
    token_rotation_enabled: false
```

and a github app with the commit status and contents permissions as well as the mandatory metadata permission. You also need to configure the app webhook to send events to `https://your-app-url.ngrok-free.app/gh` as well as the callback url to `https://your-app-url.ngrok-free.app/gh`

## Installing

Install the dependencies first

```bash
bun install
```

### Running the Slackbot

First migrate the db so you have a local copy of the database then you can run the dev script to start the server!

```bash
bunx prisma migrate dev --name db
bun run dev
```

You probably also want to run the ngrok tunnel so that your slackbot can get events from slack (double check the package.json to make sure that you changed the url to your ngrok url)

```bash
bun run ngrok
```

## Development

### Database

If you change the schema.prisma file you will need to run the following command to update the database schema

```bash
bunx prisma migrate dev
```

alternatively you can use the db push command which is a more prod friendly command

```bash
bunx prisma db push
```

## Production

~Use the docker-compose file to run the app in production~

> [!TIP]
> I found out the hard way that prisma and docker don't mix very well; I'm sure there's probably someone who has developed a bunch better system for deployment but my current solution is to just use a local (`~/.config/systemd/user/grolf.service`) systemctl service file and run in on the bare metal with bun directly.

<img src="https://github.com/kcoderhtml/grolf/raw/master/.github/images/yea_nay.svg" align="right" width="285" style="padding-left: 3rem"/>

```ini
[Unit]
Description=arcade commit helper
DefaultDependencies=no
After=network-online.target

[Service]
Type=exec
WorkingDirectory=/home/kierank/grolf
ExecStart=bun run index.ts
TimeoutStartSec=0
Restart=on-failure
RestartSec=1s

[Install]
WantedBy=default.target
```

This way its just a simple `git pull; systemctl --user restart grolf` to update grolf!

## Screenshots

![An example of an arcade thread with grolf](https://github.com/kcoderhtml/grolf/raw/master/.github/images/thread.png)
![the apphome page of grolf](https://github.com/kcoderhtml/grolf/raw/master/.github/images/apphome.png)

---

_© 2024 Kieran Klukas_  
_Licensed under [AGPL 3.0](LICENSE.md)_
