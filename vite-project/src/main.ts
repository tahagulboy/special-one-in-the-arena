import './style.css'
import { game } from './game.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = ``

game()
