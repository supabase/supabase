import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { Todo } from '../../models/todo'

@Component({
  selector: 'app-todo-item',
  templateUrl: './todo-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoItemComponent {
  @Input() todo: Todo | undefined
  @Output() delete: EventEmitter<void> = new EventEmitter<void>()
  @Output() toggleComplete: EventEmitter<void> = new EventEmitter<void>()
}
