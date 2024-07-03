export async function githubHandler(request: Request) {
    console.log("Github Handler", await request.text())
    return new Response("ok", { status: 200 });
}

const githubHandlerString = "githubHandler"
export default githubHandlerString