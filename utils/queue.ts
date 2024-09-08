export default class Queue {
    private jobs: (() => void)[] = []
    private isProcessing: boolean = false

    enqueue(job: () => void) {
        this.jobs.push(job)
        if (!this.isProcessing) {
            this.processQueue()
        }
    }

    private processQueue() {
        if (this.jobs.length > 0) {
            const job = this.jobs.shift()
            if (job) {
                this.isProcessing = true
                job()
                this.isProcessing = false
                this.processQueue()
            }
        }
    }
}
