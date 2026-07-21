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

interface Category {
  idCategory: number;
  name: string;
}

@Component({
  selector: 'app-admin-categories',
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
          <h2 class="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">Gestión de Categorías</h2>
          <p class="text-sm text-slate-500 font-medium mt-1">Administra las categorías de libros (sincronizado con tcategory)</p>
        </div>
        <p-button label="Nueva Categoría" icon="pi pi-plus" (click)="openNew()" styleClass="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-none rounded-xl font-bold text-white shadow-md shadow-indigo-500/20 px-5 py-2.5" />
      </div>

      <p-table [value]="categories" [rows]="10" [paginator]="true" responsiveLayout="scroll" styleClass="p-datatable-sm">
        <ng-template #header>
          <tr class="bg-slate-50/50">
            <th class="text-xs font-bold text-slate-500 py-4 pl-4 rounded-tl-xl">ID</th>
            <th class="text-xs font-bold text-slate-500 py-4">Nombre de Categoría</th>
            <th class="text-xs font-bold text-slate-500 py-4 text-right pr-4 rounded-tr-xl">Acciones</th>
          </tr>
        </ng-template>
        <ng-template #body let-cat>
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="py-3 pl-4 text-sm font-semibold text-slate-400">#{{ cat.idCategory }}</td>
            <td class="py-3 text-sm font-bold text-slate-700">{{ cat.name }}</td>
            <td class="py-3 pr-4 text-right">
              <div class="inline-flex gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                <button (click)="editCategory(cat)" class="w-8 h-8 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center">
                  <i class="pi pi-pencil text-sm"></i>
                </button>
                <button (click)="deleteCategory(cat)" class="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors flex items-center justify-center">
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
      [header]="isEditMode ? 'Editar Categoría' : 'Nueva Categoría'" 
      [modal]="true"
      styleClass="backdrop-blur-sm border border-slate-200/50 shadow-2xl rounded-2xl overflow-hidden">
      
      <form [formGroup]="form" class="flex flex-col gap-5 py-4 px-2">
        <div class="flex flex-col gap-2">
          <label for="name" class="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de la Categoría</label>
          <input 
            pInputText 
            id="name" 
            formControlName="name" 
            placeholder="Ej. Ingeniería de Software"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 font-semibold outline-none" />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <small class="text-rose-500 font-semibold">El nombre es requerido.</small>
          }
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
export class AdminCategories implements OnInit {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private apiService = inject(ApiService);

  categories: Category[] = [];
  displayDialog: boolean = false;
  isEditMode: boolean = false;
  form!: FormGroup;
  selectedId?: number;

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', Validators.required]
    });
    this.loadCategories();
  }

  loadCategories() {
    this.apiService.getCategories().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.categories = res.data;
          localStorage.setItem('categories', JSON.stringify(this.categories));
        }
      },
      error: () => {
        const storedCategories = localStorage.getItem('categories');
        if (storedCategories) {
          this.categories = JSON.parse(storedCategories);
        }
      }
    });
  }

  openNew() {
    this.isEditMode = false;
    this.form.reset();
    this.displayDialog = true;
  }

  editCategory(cat: Category) {
    this.isEditMode = true;
    this.selectedId = cat.idCategory;
    this.form.patchValue({ name: cat.name });
    this.displayDialog = true;
  }

  deleteCategory(cat: Category) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar la categoría "${cat.name}"? Los libros asociados podrían verse afectados.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.apiService.deleteCategory(cat.idCategory).subscribe({
          next: () => {
            this.loadCategories();
            this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Categoría eliminada.' });
          },
          error: () => {
            this.categories = this.categories.filter(c => c.idCategory !== cat.idCategory);
            localStorage.setItem('categories', JSON.stringify(this.categories));
            this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Categoría eliminada (modo local).' });
          }
        });
      }
    });
  }

  save() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const payload = {
        idCategory: this.isEditMode ? this.selectedId : undefined,
        name: formValue.name
      };

      this.apiService.saveCategory(payload).subscribe({
        next: () => {
          this.loadCategories();
          this.messageService.add({ 
            severity: 'success', 
            summary: this.isEditMode ? 'Actualizada' : 'Creada', 
            detail: this.isEditMode ? 'Categoría actualizada exitosamente.' : 'Nueva categoría registrada.' 
          });
          this.displayDialog = false;
        },
        error: () => {
          if (this.isEditMode && this.selectedId !== undefined) {
            const index = this.categories.findIndex(c => c.idCategory === this.selectedId);
            if (index !== -1) {
              this.categories[index] = { ...this.categories[index], name: formValue.name };
            }
          } else {
            const newCat: Category = {
              idCategory: this.categories.length > 0 ? Math.max(...this.categories.map(c => c.idCategory)) + 1 : 1,
              name: formValue.name
            };
            this.categories.push(newCat);
          }
          localStorage.setItem('categories', JSON.stringify(this.categories));
          this.displayDialog = false;
        }
      });
    }
  }
}
