// Decorators
import { NgModule } from '@angular/core';

// Modules
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

// Components
import { HomeComponent } from './components/landing/home/home.component';



const routes: Routes = [
  {
    path: 'user',
    loadChildren: './components/user/user.module#UserModule'
  },
  {
    path: 'plant',
    loadChildren: './components/plant/plant.module#PlantModule'
  },
  {
    path: 'categories',
    loadChildren: './components/categories/categories.module#CategoriesModule'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes,
      { preloadingStrategy: PreloadAllModules }
    )],
  exports: [RouterModule]
})
export class AppRoutingModule { }
