import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ApiService } from '../../../service/api.service';

interface Author {
  idAuthor: number;
  firstName: string;
  surName: string;
}

@Component({
  selector: 'app-admin-authors',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule
  ],
  template: `
    <p-toast />
    <p-confirmdialog />

    <div class="bg-white border border-slate-200/80 rounded-[2rem] p-6 sm:p-8 flex flex-col gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 class="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">Gestión de Autores</h2>
          <p class="text-sm text-slate-500 font-medium mt-1">Administra los autores de los libros (sincronizado con tauthor)</p>
        </div>
        <p-button label="Nuevo Autor" icon="pi pi-plus" (click)="openNew()" styleClass="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-none rounded-xl font-bold text-white shadow-md shadow-indigo-500/20 px-5 py-2.5" />
      </div>

      <p-table [value]="authors" [rows]="10" [paginator]="true" responsiveLayout="scroll" styleClass="p-datatable-sm">
        <ng-template #header>
          <tr class="bg-slate-50/50">
            <th class="text-xs font-bold text-slate-500 py-4 pl-4 rounded-tl-xl">ID</th>
            <th class="text-xs font-bold text-slate-500 py-4">Nombres</th>
            <th class="text-xs font-bold text-slate-500 py-4">Apellidos</th>
            <th class="text-xs font-bold text-slate-500 py-4 text-right pr-4 rounded-tr-xl">Acciones</th>
          </tr>
        </ng-template>
        <ng-template #body let-author>
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="py-3 pl-4 text-sm font-semibold text-slate-400">#{{ author.idAuthor }}</td>
            <td class="py-3 text-sm font-bold text-slate-700">{{ author.firstName }}</td>
            <td class="py-3 text-sm font-bold text-slate-700">{{ author.surName }}</td>
            <td class="py-3 pr-4 text-right">
              <div class="inline-flex gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                <button (click)="editAuthor(author)" class="w-8 h-8 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center">
                  <i class="pi pi-pencil text-sm"></i>
                </button>
                <button (click)="deleteAuthor(author)" class="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors flex items-center justify-center">
                  <i class="pi pi-trash text-sm"></i>
                </button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog 
      [(visible)]="displayDialog" 
      [style]="{width: '450px'}" 
      [header]="isEditMode ? 'Editar Autor' : 'Nuevo Autor'" 
      [modal]="true"
      styleClass="backdrop-blur-sm border border-slate-200/50 shadow-2xl rounded-2xl overflow-hidden">
      
      <form [formGroup]="form" class="flex flex-col gap-5 py-4 px-2">
        <div class="flex flex-col gap-2">
          <label for="firstName" class="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombres</label>
          <input 
            pInputText 
            id="firstName" 
            formControlName="firstName" 
            placeholder="Ej. Gabriel"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 font-semibold outline-none" />
        </div>
        
        <div class="flex flex-col gap-2">
          <label for="surName" class="text-xs font-bold text-slate-500 uppercase tracking-wider">Apellidos</label>
          <input 
            pInputText 
            id="surName" 
            formControlName="surName" 
            placeholder="Ej. García Márquez"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 font-semibold outline-none" />
        </div>

        <div class="flex justify-end gap-3 border-t border-slate-100 pt-6 mt-2">
          <p-button label="Cancelar" [text]="true" severity="secondary" (click)="displayDialog = false" styleClass="font-bold rounded-xl px-5" />
          <p-button 
            label="Guardar" 
            icon="pi pi-check" 
            [disabled]="form.invalid" 
            (click)="save()" 
            styleClass="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-none rounded-xl px-6 py-2.5 shadow-md shadow-indigo-500/20 transition-all font-bold disabled:opacity-50" />
        </div>
      </form>
    </p-dialog>
  `,
  providers: [MessageService, ConfirmationService]
})
export class AdminAuthors implements OnInit {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private apiService = inject(ApiService);

  authors: Author[] = [];
  displayDialog: boolean = false;
  isEditMode: boolean = false;
  form!: FormGroup;
  selectedId?: number;

  ngOnInit() {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      surName: ['', Validators.required]
    });
    this.loadAuthors();
  }

  loadAuthors() {
    this.apiService.getAuthors().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.authors = res.data;
          localStorage.setItem('authors', JSON.stringify(this.authors));
        }
      },
      error: () => {
        const stored = localStorage.getItem('authors');
        if (stored) {
          this.authors = JSON.parse(stored);
        }
      }
    });
  }

  openNew() {
    this.isEditMode = false;
    this.form.reset();
    this.displayDialog = true;
  }

  editAuthor(author: Author) {
    this.isEditMode = true;
    this.selectedId = author.idAuthor;
    this.form.patchValue({ firstName: author.firstName, surName: author.surName });
    this.displayDialog = true;
  }

  deleteAuthor(author: Author) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el autor "${author.firstName} ${author.surName}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.apiService.deleteAuthor(author.idAuthor).subscribe({
          next: () => {
            this.loadAuthors();
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Autor eliminado.' });
          },
          error: () => {
            this.authors = this.authors.filter(a => a.idAuthor !== author.idAuthor);
            localStorage.setItem('authors', JSON.stringify(this.authors));
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Autor eliminado (modo local).' });
          }
        });
      }
    });
  }

  save() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const payload = {
        idAuthor: this.isEditMode ? this.selectedId : undefined,
        firstName: formValue.firstName,
        surName: formValue.surName
      };

      this.apiService.saveAuthor(payload).subscribe({
        next: () => {
          this.loadAuthors();
          this.messageService.add({ 
            severity: 'success', 
            summary: this.isEditMode ? 'Actualizado' : 'Creado', 
            detail: this.isEditMode ? 'Autor actualizado exitosamente.' : 'Nuevo autor registrado.' 
          });
          this.displayDialog = false;
        },
        error: () => {
          // Fallback local
          if (this.isEditMode && this.selectedId !== undefined) {
            const index = this.authors.findIndex(a => a.idAuthor === this.selectedId);
            if (index !== -1) {
              this.authors[index] = { ...this.authors[index], firstName: formValue.firstName, surName: formValue.surName };
            }
          } else {
            const newAuthor: Author = {
              idAuthor: this.authors.length > 0 ? Math.max(...this.authors.map(a => a.idAuthor)) + 1 : 1,
              firstName: formValue.firstName,
              surName: formValue.surName
            };
            this.authors.push(newAuthor);
          }
          localStorage.setItem('authors', JSON.stringify(this.authors));
          this.displayDialog = false;
        }
      });
    }
  }
}
