#include <dlfcn.h>
#include <stdio.h>
typedef int (*Launch)(int,char**,int,const char**,int,const char**,const char*,const char*,const char*,const char*,unsigned char,unsigned char,unsigned char,int);
int main(int argc,char**argv){
  const char* lib="/Applications/DELTAproject.app/Contents/runtime/Contents/Home/lib/libjli.dylib";
  void*h=dlopen(lib,RTLD_NOW); if(!h){fprintf(stderr,"%s\n",dlerror());return 1;}
  Launch L=(Launch)dlsym(h,"JLI_Launch"); if(!L){fprintf(stderr,"no JLI_Launch\n");return 1;}
  return L(argc,argv,0,NULL,0,NULL,"23.0.1","23","java","java",0,1,0,0);
}
