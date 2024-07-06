# grolf

Your friendly lightweight arcade helper written in Bun

## Prerequisites
You need a slack app with the following manifest

```yaml
display_information:
  name: Grolf
  description: This grolf has a special Fähigkeiten which is to grab your git commits and plop them somewhere
  background_color: "#203020"
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

## Dev
To run install the deps and run bun dev
    
```bash
bun install
bun dev
```

## Production
Use the docker-compose file to run the app in production

```bash
docker-compose up -d
```